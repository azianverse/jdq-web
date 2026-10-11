import React from 'react';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HiddenGemHighlights } from './HiddenGemHighlights';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get: mocks.get } }));
vi.mock('./DestinationMedia', () => ({ DestinationMedia: () => <div>Destination photo</div> }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
afterEach(cleanup);
beforeEach(() => { mocks.get.mockReset(); });
const data = [{ id: 'gem-one', name: 'Test Cove', municipality: 'Test municipality', reason: 'Matches your travel interests', crowd_status: 'unknown' }];
describe('Hidden Gem promotional card', () => {
  it('renders one recommendation with truthful crowd copy and destination link', async () => {
    mocks.get.mockResolvedValue({ data: { success: true, data } });
    render(<HiddenGemHighlights actorId="one" />);
    await screen.findByText('Test Cove');
    expect(screen.getByRole('heading', { name: 'Hidden Gem' })).toBeTruthy();
    expect(screen.getByText('Crowd level unknown')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore this place' }).getAttribute('href')).toBe('/spots/gem-one');
    expect(screen.getByText(/Not sponsored/)).toBeTruthy();
  });
  it('shows empty state rather than a famous fallback', async () => {
    mocks.get.mockResolvedValue({ data: { success: true, data: [] } });
    render(<HiddenGemHighlights />);
    expect(await screen.findByText(/No eligible hidden gems/)).toBeTruthy();
  });
  it('offers retry after failure', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: { success: true, data } });
    render(<HiddenGemHighlights />);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Test Cove')).toBeTruthy();
  });
  it('clears previous actor results while a different account loads', async () => {
    mocks.get.mockResolvedValueOnce({ data: { success: true, data } });
    const view = render(<HiddenGemHighlights actorId="one" />);
    await screen.findByText('Test Cove');
    mocks.get.mockImplementation(() => new Promise(() => {}));
    view.rerender(<HiddenGemHighlights actorId="two" />);
    await waitFor(() => expect(screen.queryByText('Test Cove')).toBeNull());
    expect(screen.getByText(/Finding discovery picks/)).toBeTruthy();
  });
});
