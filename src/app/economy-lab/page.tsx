import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import EconomyLabClient from './EconomyLabClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Local Economy Lab', robots: { index: false, follow: false } };

export default async function EconomyLabPage() {
  // A production build cannot expose the page even if a public user guesses it.
  if (process.env.NODE_ENV === 'production' || process.env.JDQ_ECONOMY_LAB !== 'true') notFound();
  const target = process.env.API_PROXY_TARGET;
  if (target !== 'http://127.0.0.1:4300') notFound();
  const session = (await cookies()).toString();
  if (!session) redirect('/login?redirect=%2Feconomy-lab');
  let response: Response;
  try {
    response = await fetch(`${target}/api/v1/auth/me`, {
      headers: { Cookie: session }, cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error('Local economy lab session validation unavailable.');
  }
  if (response.status === 401 || response.status === 403) redirect('/login?redirect=%2Feconomy-lab');
  if (!response.ok) throw new Error('Local economy lab session validation unavailable.');
  return <EconomyLabClient />;
}
