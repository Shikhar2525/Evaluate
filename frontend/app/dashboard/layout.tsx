import type { Metadata } from 'next';
import { dashboardMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = dashboardMetadata;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
