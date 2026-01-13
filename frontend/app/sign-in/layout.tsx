import type { Metadata } from 'next';
import { signInMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = signInMetadata;

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
