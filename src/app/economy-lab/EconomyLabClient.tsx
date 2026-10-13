'use client';

import { useCallback, useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const questId = 'lab-economy-reviewed-quest';
const fixtureCoordinates = { captured_lat: 16.0, captured_lng: 120.0, captured_accuracy: 8 };
type Page<T> = { items: T[]; next_cursor: string | null };
type Reservation = {
  id: string; quest_id: string; amount_minor: string; status: string; attempt_id: string | null;
  submission_id: string | null; expires_at: string; appeal_until: string | null;
};
type Activity = {
  id: string; operation: string; amount_minor: string; direction: 'credit' | 'debit';
  created_at: string; reference_kind: string; reference_id: string;
};
type Entitlement = { id: string; cosmetic_id: string; status: string; transaction_id: string; refunded_at: string | null };
type Cosmetic = { id: string; cost_minor: string; asset: string };
type Reward = { pool_id: string; reward_minor: string; funded_slots_available: boolean; policy_version: string; reservation_seconds: number } | null;

function message(error: unknown): string {
  const response = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
  return response.response?.data?.error?.message || response.response?.data?.error?.code ||
    (error instanceof Error ? error.message : 'Request failed. Inspect the local API and retry.');
}

export default function EconomyLabClient() {
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [reward, setReward] = useState<Reward>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('Please independently review my synthetic lab proof again.');
  const hasCompletedQuest = reservations.some(r => r.quest_id === questId && r.status === 'paid');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const capability = await api.get('/economy/capabilities');
      if (capability.data?.data?.environment !== 'local_simulation' || !capability.data?.data?.schema_ready) {
        throw new Error('The local simulation database is not ready.');
      }
      const [me, preview, reservationsResponse, activityResponse, entitlementsResponse, cosmeticsResponse] =
        await Promise.all([
          api.get('/economy/me'), api.get(`/economy/quests/${questId}/reward`),
          api.get('/economy/me/reservations?limit=20'), api.get('/economy/me/activity?limit=20'),
          api.get('/economy/me/entitlements?limit=20'), api.get('/economy/cosmetics'),
        ]);
      if (me.data?.data?.asset !== 'EXPLORER_COIN_SIM') throw new Error('Unexpected economy asset.');
      setBalance(String(me.data.data.balance_minor));
      setReward(preview.data?.data ?? null);
      setReservations((reservationsResponse.data?.data as Page<Reservation>)?.items ?? []);
      setActivity((activityResponse.data?.data as Page<Activity>)?.items ?? []);
      setEntitlements((entitlementsResponse.data?.data as Page<Entitlement>)?.items ?? []);
      setCosmetics((cosmeticsResponse.data?.data as Cosmetic[]) ?? []);
    } catch (cause) {
      setBalance(null);
      setError(message(cause));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!isLoading && user?.id) void refresh(); }, [isLoading, user?.id, refresh]);

  const act = async (action: () => Promise<string>) => {
    setBusy(true); setError(null); setNotice(null);
    let actionError: string | null = null;
    try { setNotice(await action()); }
    catch (cause) { actionError = message(cause); }
    finally {
      await refresh();
      if (actionError) setError(actionError);
      setBusy(false);
    }
  };

  const start = () => act(async () => {
    const result = await api.post(`/quests/${questId}/attempts`);
    const reservation = result.data?.data?.reward_reservation;
    return reservation
      ? `Synthetic funded attempt ${result.data.data.id} reserved ${reservation.amountMinor} Explorer Coins. No reward has been issued.`
      : 'Quest attempt started without a funded reward. No Explorer Coins are promised.';
  });

  const submitSyntheticProof = () => act(async () => {
    const keyName = `jdq-economy-lab-proof:${user?.id}:${questId}`;
    let payload: { quest_id: string; idempotency_key: string; challenge_token: string;
      captured_lat: number; captured_lng: number; captured_accuracy: number };
    const saved = sessionStorage.getItem(keyName);
    if (saved) payload = JSON.parse(saved);
    else {
      const challenge = await api.post(`/quests/${questId}/challenge`);
      payload = { quest_id: questId, idempotency_key: crypto.randomUUID(),
        challenge_token: challenge.data?.data?.challenge_token, ...fixtureCoordinates };
      sessionStorage.setItem(keyName, JSON.stringify(payload));
    }
    const result = await api.post('/submissions', payload);
    if (result.data?.data?.id) sessionStorage.removeItem(keyName);
    return `Synthetic fixture proof ${result.data?.data?.id ?? ''} is pending independent admin review. Coordinates are fictional test input, not a physical visit.`;
  });

  const buyCosmetic = (id: string) => act(async () => {
    const keyName = `jdq-economy-lab-purchase:${user?.id}:${id}`;
    let key = sessionStorage.getItem(keyName);
    if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(keyName, key); }
    const result = await api.post(`/wallet/cosmetics/${id}/purchase`, {}, { headers: { 'x-idempotency-key': key } });
    if (result.data?.data?.transactionId) sessionStorage.removeItem(keyName);
    return `Optional simulated cosmetic purchase committed: ${result.data?.data?.transactionId ?? 'receipt unavailable'}.`;
  });

  const appeal = (id: string) => act(async () => {
    await api.post(`/economy/reservations/${id}/appeal`, { reason: appealReason });
    return 'Appeal submitted for a different reviewer. No coin has been issued.';
  });

  return <Navigation>
    <main id="main-content" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-amber-400 bg-amber-50 p-5 text-amber-950">
        <p className="text-xs font-black uppercase tracking-widest">Local development only · synthetic fixture</p>
        <h1 className="mt-2 text-2xl font-bold">Explorer Coin economy lab</h1>
        <p className="mt-2 text-sm">These are simulated, off-chain Explorer Coins in an isolated disposable database. They are not mJDQ, JDQ, cash, merchant credit, or proof of a physical visit.</p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm">{error} <button className="ml-2 underline" onClick={() => void refresh()}>Retry</button></div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm">{notice}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void refresh()} disabled={loading || busy} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Refresh durable state</button>
        <span className="text-xs text-stone-600">Reviewer: open the local admin dashboard on port 5175 in another browser session.</span>
      </div>
      {loading && <p role="status">Loading durable simulation state…</p>}
      {!loading && balance !== null && <>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Private simulated wallet</h2>
          <p className="mt-2 text-3xl font-black" data-testid="economy-balance">{balance} <span className="text-sm font-medium">Explorer Coins</span></p>
          <p className="text-xs text-stone-600">Zero cash value. No conversion to JDQ. Balance comes from PostgreSQL, never from browser cache.</p>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Fictional reviewed checkpoint</h2>
          {reward ? <p className="mt-2 text-sm">Pool {reward.pool_id}: {reward.reward_minor} simulated coins after independent approval. Policy {reward.policy_version}. {hasCompletedQuest ? 'This traveler already completed the fixture quest; no repeat reward is available.' : reward.funded_slots_available ? 'A funded slot is currently available.' : 'No funded slot is available.'}</p>
            : <p className="mt-2 text-sm">No funded reward is available. Starting must not imply a coin promise.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void start()} disabled={busy || !reward?.funded_slots_available || hasCompletedQuest || reservations.some(r => r.quest_id === questId && ['submitted','appeal'].includes(r.status))} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start or resume attempt</button>
            <button type="button" onClick={() => void submitSyntheticProof()} disabled={busy || !reservations.some(r => r.status === 'reserved')} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Submit synthetic fixture proof</button>
          </div>
          <p className="mt-2 text-xs text-stone-600">The test coordinates are fixed at a fictional venue. This validates the server flow, not actual traveler presence.</p>
          <ol className="mt-4 space-y-2 text-sm">
            {reservations.length === 0 && <li>No reservations yet.</li>}
            {reservations.map(r => <li key={r.id} className="rounded-lg bg-stone-50 p-3">
              <strong>{r.status}</strong> · {r.amount_minor} simulated coins · reservation {r.id}
              <span className="block text-xs">Expires {r.expires_at}; appeal deadline {r.appeal_until ?? 'not set'}</span>
              {r.status === 'appeal' && <div className="mt-2 flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`appeal-${r.id}`}>Appeal reason</label>
                <input id={`appeal-${r.id}`} value={appealReason} onChange={event => setAppealReason(event.target.value)} className="min-w-0 flex-1 rounded border px-2 py-1" />
                <button type="button" onClick={() => void appeal(r.id)} disabled={busy || appealReason.trim().length < 10} className="rounded border px-3 py-1 disabled:opacity-50">Submit appeal</button>
              </div>}
            </li>)}
          </ol>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Optional simulated cosmetics</h2>
          <p className="text-xs text-stone-600">Catalog IDs are test fixtures; no real cosmetic is fulfilled in the traveler app yet.</p>
          {cosmetics.length === 0 && <p className="mt-2 text-sm">No cosmetics are active.</p>}
          {cosmetics.map(item => <div key={item.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 p-3 text-sm">
            <span>{item.id} · {item.cost_minor} simulated coins</span>
            <button type="button" onClick={() => void buyCosmetic(item.id)} disabled={busy || entitlements.some(e => e.cosmetic_id === item.id) || BigInt(balance) < BigInt(item.cost_minor)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Confirm optional purchase</button>
          </div>)}
          <h3 className="mt-5 font-semibold">Private entitlements</h3>
          {entitlements.length === 0 ? <p className="text-sm">None.</p> : <ul className="text-sm">{entitlements.map(e => <li key={e.id}>{e.cosmetic_id}: {e.status} · receipt {e.transaction_id}</li>)}</ul>}
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Private economic activity</h2>
          {activity.length === 0 ? <p className="text-sm">No committed events.</p> : <ul className="mt-2 space-y-2 text-sm">{activity.map(item => <li key={item.id} className="rounded-lg bg-stone-50 p-3">{item.direction === 'credit' ? '+' : '−'}{item.amount_minor} · {item.operation} · {new Date(item.created_at).toLocaleString()}<span className="block break-all text-xs">{item.reference_kind}: {item.reference_id} · receipt {item.id}</span></li>)}</ul>}
        </section>
      </>}
    </main>
  </Navigation>;
}
