import { Quicksand } from 'next/font/google';
import { pageMetadata } from '@/lib/page-metadata';
import { CozyDashboardClient } from './cozy/CozyDashboardClient';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-quicksand',
});

export const metadata = pageMetadata(
  'JuanDer Without Limits - Island Explorer Hub',
  'Your personal Pangasinan adventure hub: live GPS mini-map, pre-registered events calendar, quest progress, community spotlight, merchant perks, and daily eco-tips.',
  '/dashboard'
);

export default function DashboardPage() {
  return (
    <div className={`${quicksand.className} ${quicksand.variable}`}>
      <CozyDashboardClient />
    </div>
  );
}
