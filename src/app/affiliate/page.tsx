import type { Metadata } from 'next';
import { AffiliateClient } from './AffiliateClient';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata: Metadata = {
  ...pageMetadata(
    'Merchant Affiliate Hub — Coming Soon',
    'Partner application and dashboard for local tourism businesses. Apply to showcase your establishment and join future tourism programs.',
    '/affiliate',
  ),
};

export default function AffiliatePage() {
  return <AffiliateClient />;
}
