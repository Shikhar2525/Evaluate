import type { Metadata } from 'next';
import { signUpMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = signUpMetadata;

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
