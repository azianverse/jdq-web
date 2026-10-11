'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { DestinationMedia } from './DestinationMedia';

type Highlight = { id: string; name: string; municipality: string; image_url?: string; reason: string; crowd_status: string };
export function HiddenGemHighlights({ actorId }: { actorId?: string }) {
  const [result, setResult] = useState<{ actorId?: string; retry: number; items: Highlight[]; failed: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/spots/highlights', { signal: controller.signal }).then(response => {
      if (!response.data?.success || !Array.isArray(response.data.data)) throw new Error('Invalid highlights');
      if (!controller.signal.aborted) setResult({ actorId, retry, items: response.data.data, failed: false });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ actorId, retry, items: [], failed: true });
    });
    return () => controller.abort();
  }, [actorId, retry]);
  const current = result?.actorId === actorId && result?.retry === retry ? result : null;
  return <section aria-label="Hidden Gem" className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 min-w-0">
    <h2 className="font-bold text-lg">Hidden Gem</h2>
    <p className="text-xs text-[var(--color-text-muted)]">Recommended for you · Not sponsored</p>
    {!current ? <p role="status">Finding discovery picks…</p> : current.failed ?
      <div role="status">Discovery picks are unavailable. <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Try again</button></div> :
      current.items.length === 0 ? <p className="mt-3 text-sm">No eligible hidden gems right now. Explore the destinations below.</p> :
      <ul className="mt-3 space-y-3">
        {current.items.slice(0, 1).map(spot => <li key={spot.id} className="min-w-0 break-words">
          <Link href={appRoutes.spot(spot.id)}><DestinationMedia src={spot.image_url} alt={spot.name} destinationName={spot.name} municipality={spot.municipality} /></Link>
          <h3 className="font-semibold">{spot.name}</h3>
          <p className="text-sm">{spot.municipality}</p>
          <p className="text-xs my-2">{spot.reason}</p>
          <p className="text-xs mb-2">{spot.crowd_status === 'unknown' ? 'Crowd level unknown' : `Estimated ${spot.crowd_status}`}</p>
          <p className="text-xs mb-3 text-[var(--color-text-muted)]">Discovery pick, not a live crowd or popularity measurement.</p>
          <Link href={appRoutes.spot(spot.id)} className="underline text-sm">Explore this place</Link>
        </li>)}
      </ul>}
  </section>;
}
