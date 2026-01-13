import type { Metadata } from 'next';
import { templatesMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = templatesMetadata;

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
