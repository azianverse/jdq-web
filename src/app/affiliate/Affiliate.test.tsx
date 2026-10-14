import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AffiliateClient } from './AffiliateClient';
import { fetchOsmAreas } from '@/lib/osm';
import { submitAffiliateApplication } from '@/lib/api';

vi.mock('@/components/Navigation', () => ({ Navigation: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/MiniMapPreview', () => ({
  MiniMapPreview: ({ onLocationChange, showMarker }: { onLocationChange: (lat: number, lng: number) => void; showMarker: boolean }) => (
    <div>
      <span>{showMarker ? 'Pin visible' : 'No pin'}</span>
      <button onClick={() => onLocationChange(16.4023, 120.596)}>Place test pin</button>
    </div>
  ),
}));
vi.mock('@/components/CelebrationEffects', () => ({ triggerCelebration: vi.fn() }));
vi.mock('@/lib/auth', () => {
  const user = { displayName: 'Maria Santos', email: 'maria@example.com' };
  return { useAuth: () => ({ user }) };
});
vi.mock('@/lib/osm', () => ({ fetchOsmAreas: vi.fn() }));
vi.mock('@/lib/api', () => ({
  fetchAffiliateOptions: vi.fn().mockResolvedValue(null),
  fetchMyAffiliateApplication: vi.fn().mockResolvedValue({ data: null, merchant: null }),
  fetchAffiliateDraft: vi.fn().mockResolvedValue(null),
  saveAffiliateDraft: vi.fn().mockResolvedValue({ revision: 1 }),
  deleteAffiliateDraft: vi.fn(),
  submitAffiliateApplication: vi.fn().mockResolvedValue({ id: 'app-test', business_name: 'Mountain Cafe', municipality: 'Baguio City', business_province: 'Benguet', category: 'dining', status: 'received', version: 1 }),
  resubmitAffiliateApplication: vi.fn(),
}));

describe('Affiliate location application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOsmAreas).mockResolvedValue([{ id: 'osm-baguio', name: 'Baguio City', type: 'city', subtitle: 'Benguet, Philippines', center: [16.4023, 120.596], zoom: 12, keywords: [], source: 'osm' }]);
  });

  it('accepts a business outside Pangasinan and requires a deliberate map pin', async () => {
    render(<AffiliateClient />);
    expect(screen.getByText(/Pangasinan is our starting catalog, not a restriction/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Start Guided Application/i }));
    fireEvent.change(screen.getByPlaceholderText(/Bonuan Waterfront/i), { target: { value: 'Mountain Cafe' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    fireEvent.change(screen.getByRole('searchbox', { name: /Search map location/i }), { target: { value: 'Baguio City' } });
    fireEvent.click(screen.getByRole('button', { name: /Search map/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Baguio City/i }));
    expect(screen.getByText('No pin')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('e.g., Benguet'), { target: { value: 'Benguet' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Place a valid business pin/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Place test pin' }));
    expect(screen.getByText('Pin visible')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    fireEvent.change(screen.getByPlaceholderText(/Maria Elena Santos/i), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByPlaceholderText(/inquiries@islandgrill/i), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/\+63 917/i), { target: { value: '+639171234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Tourism Partner Declaration/i }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Official Application/i }));

    await waitFor(() => expect(submitAffiliateApplication).toHaveBeenCalledWith(expect.objectContaining({
      municipality: 'Baguio City',
      business_province: 'Benguet',
      gps_lat: 16.4023,
      gps_lng: 120.596,
    })));
  }, 15000);

  it('can select the current browser location as the business pin', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (success: (position: { coords: { latitude: number; longitude: number } }) => void) => success({ coords: { latitude: 14.5995, longitude: 120.9842 } }) },
    });
    render(<AffiliateClient />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /Start Guided Application/i }));
    fireEvent.change(screen.getByPlaceholderText(/Bonuan Waterfront/i), { target: { value: 'Manila Cafe' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Use my location/i })); });
    expect(screen.getByText(/Pin selected: 14.599500, 120.984200/i)).toBeDefined();
    expect(screen.getByText('Pin visible')).toBeDefined();
  });
});
