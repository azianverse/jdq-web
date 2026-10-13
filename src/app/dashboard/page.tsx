import { pageMetadata } from '@/lib/page-metadata';
import { DashboardClient } from './DashboardClient';

export const metadata = pageMetadata(
  'Explorer Dashboard',
  'Your personal Pangasinan adventure hub: personalized recommendations, gamified explorer progression, voting rounds, cultural quizzes, and recent activities.',
  '/dashboard'
);

export default function DashboardPage() {
  return <DashboardClient />;
}
