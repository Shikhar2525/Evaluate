import type { Metadata } from 'next';
import { interviewsMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = interviewsMetadata;

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
