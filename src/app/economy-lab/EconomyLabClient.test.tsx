import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EconomyLabClient from './EconomyLabClient';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/components/Navigation', () => ({ Navigation: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: { id: 'lab-traveler' }, isLoading: false }) }));
vi.mock('@/lib/api', () => ({ api: { get, post } }));

const page = (items: unknown[] = []) => ({ items, next_cursor: null });
function respond(path: string, balance = '0', reservations: unknown[] = [], entitlements: unknown[] = []) {
  if (path === '/economy/capabilities') return { data: { data: { environment: 'local_simulation', schema_ready: true } } };
  if (path === '/economy/me') return { data: { data: { asset: 'EXPLORER_COIN_SIM', balance_minor: balance } } };
  if (path.includes('/reward')) return { data: { data: { pool_id: 'lab-pool', reward_minor: '100',
    policy_version: 'v1', funded_slots_available: true, reservation_seconds: 3600 } } };
  if (path.includes('/reservations')) return { data: { data: page(reservations) } };
  if (path.includes('/activity')) return { data: { data: page() } };
  if (path.includes('/entitlements')) return { data: { data: page(entitlements) } };
  if (path.includes('/cosmetics')) return { data: { data: [{ id: 'lab-compass', cost_minor: '40', asset: 'EXPLORER_COIN_SIM' }] } };
  throw new Error(`Unexpected local API path ${path}`);
}

describe('EconomyLabClient truth and failure states', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

  it('keeps pending proof at zero and does not promise instant reward', async () => {
    get.mockImplementation(async (path: string) => respond(path, '0', [{ id:'reservation-1', quest_id:'lab-economy-reviewed-quest',
      amount_minor:'100', status:'submitted', expires_at:'2026-10-10T15:00:00Z', appeal_until:null }]));
    render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByTestId('economy-balance').textContent).toContain('0 Explorer Coins'));
    expect(screen.getByText(/submitted/)).toBeDefined();
    expect(screen.getByRole('button', { name:'Submit synthetic fixture proof' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/not mJDQ, JDQ, cash/)).toBeDefined();
  });

  it('shows unavailable and retry instead of fabricating a balance on 503', async () => {
    get.mockRejectedValueOnce({ response: { data: { error: { code:'DATABASE_REQUIRED', message:'Durable database required.' } } } });
    get.mockImplementation(async (path: string) => respond(path));
    render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Durable database required'));
    expect(screen.queryByTestId('economy-balance')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name:'Retry' }));
    await waitFor(() => expect(screen.getByTestId('economy-balance').textContent).toContain('0 Explorer Coins'));
  });

  it('does not offer a repeat quest award or repurchase of a corrected entitlement', async () => {
    get.mockImplementation(async (path: string) => respond(path, '100', [{ id:'reservation-2', quest_id:'lab-economy-reviewed-quest',
      amount_minor:'100', status:'paid', expires_at:'2026-10-10T15:00:00Z', appeal_until:null }],
      [{ id:'entitlement-1', cosmetic_id:'lab-compass', status:'refunded', transaction_id:'purchase-1', refunded_at:'2026-10-10T14:00:00Z' }]));
    render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByTestId('economy-balance').textContent).toContain('100 Explorer Coins'));
    expect(screen.getByText(/no repeat reward is available/)).toBeDefined();
    expect(screen.getByRole('button', { name:'Start or resume attempt' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name:'Confirm optional purchase' }).hasAttribute('disabled')).toBe(true);
  });

  it('retains purchase idempotency key across an uncertain response', async () => {
    get.mockImplementation(async (path: string) => respond(path, '100'));
    post.mockRejectedValueOnce(new Error('Network timeout')).mockResolvedValueOnce({ data:{ data:{ transactionId:'purchase-1' } } });
    render(<EconomyLabClient />);
    const button = await screen.findByRole('button', { name:'Confirm optional purchase' });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Network timeout'));
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[0][2].headers['x-idempotency-key']).toBe(post.mock.calls[1][2].headers['x-idempotency-key']);
  });

  it.each([
    [401, 'Session expired'], [403, 'Reviewer only'], [404, 'Quest not found'], [409, 'Attempt conflict'],
  ])('shows a truthful HTTP %i action failure and no invented credit', async (_status, description) => {
    get.mockImplementation(async (path: string) => respond(path));
    post.mockRejectedValueOnce({ response: { status: _status,
      data: { error: { code: `HTTP_${_status}`, message: description } } } });
    render(<EconomyLabClient />);
    const start = await screen.findByRole('button', { name:'Start or resume attempt' });
    fireEvent.click(start);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(description));
    expect(screen.getByTestId('economy-balance').textContent).toContain('0 Explorer Coins');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('disables funded start when the server reports no remaining slot', async () => {
    get.mockImplementation(async (path: string) => {
      const result = respond(path);
      if ('funded_slots_available' in result.data.data) result.data.data.funded_slots_available = false;
      return result;
    });
    render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByText(/No funded slot is available/)).toBeDefined());
    expect(screen.getByRole('button', { name:'Start or resume attempt' }).hasAttribute('disabled')).toBe(true);
  });

  it('submits an appeal without crediting a pending proof', async () => {
    get.mockImplementation(async (path: string) => respond(path, '0', [{ id:'reservation-appeal',
      quest_id:'lab-economy-reviewed-quest', amount_minor:'100', status:'appeal',
      expires_at:'2026-10-10T15:00:00Z', appeal_until:'2026-10-10T16:00:00Z' }]));
    post.mockResolvedValue({ data:{ data:{ id:'appeal-1' } } });
    render(<EconomyLabClient />);
    const appeal = await screen.findByRole('button', { name:'Submit appeal' });
    fireEvent.click(appeal);
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      '/economy/reservations/reservation-appeal/appeal',
      expect.objectContaining({ reason: expect.any(String) })
    ));
    expect(screen.getByTestId('economy-balance').textContent).toContain('0 Explorer Coins');
  });

  it('restores committed wallet state after remount without replaying a purchase', async () => {
    get.mockImplementation(async (path: string) => respond(path, '60', [{ id:'reservation-paid',
      quest_id:'lab-economy-reviewed-quest', amount_minor:'100', status:'paid',
      expires_at:'2026-10-10T15:00:00Z', appeal_until:null }],
      [{ id:'entitlement-owned', cosmetic_id:'lab-compass', status:'owned',
        transaction_id:'purchase-1', refunded_at:null }]));
    const first = render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByTestId('economy-balance').textContent).toContain('60 Explorer Coins'));
    first.unmount();
    render(<EconomyLabClient />);
    await waitFor(() => expect(screen.getByTestId('economy-balance').textContent).toContain('60 Explorer Coins'));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name:'Confirm optional purchase' }).hasAttribute('disabled')).toBe(true);
  });
});
