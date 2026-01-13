import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://evaluate.app';

export const createPageMetadata = (
  title: string,
  description: string,
  path: string = '',
  keywords: string[] = [],
): Metadata => ({
  title: `${title} | Evaluate`,
  description,
  keywords: [...keywords, 'interview management', 'hiring', 'recruitment'],
  alternates: {
    canonical: path ? `${baseUrl}${path}` : baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: path ? `${baseUrl}${path}` : baseUrl,
    siteName: 'Evaluate',
    title: `${title} | Evaluate`,
    description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | Evaluate`,
    description,
    images: ['/og-image.png'],
  },
});

export const dashboardMetadata: Metadata = createPageMetadata(
  'Dashboard',
  'View your interview analytics, recent templates, and pending interviews at a glance',
  '/dashboard',
  ['analytics', 'dashboard', 'interview stats', 'performance metrics'],
);

export const templatesMetadata: Metadata = createPageMetadata(
  'Interview Templates',
  'Create, manage, and customize interview templates with sections and questions',
  '/templates',
  ['templates', 'interview questions', 'question library', 'template management'],
);

export const interviewsMetadata: Metadata = createPageMetadata(
  'Interviews',
  'Schedule, conduct, and manage interviews with real-time feedback and scoring',
  '/interviews',
  ['interview management', 'candidate interviews', 'interview scheduling', 'interview tracking'],
);

export const newInterviewMetadata: Metadata = createPageMetadata(
  'New Interview',
  'Create a new interview from your templates and manage candidate evaluations',
  '/interviews/new',
  ['create interview', 'new interview', 'interview setup', 'candidate evaluation'],
);

export const signInMetadata: Metadata = createPageMetadata(
  'Sign In',
  'Sign in to your Evaluate account to manage interviews and templates',
  '/sign-in',
  ['login', 'sign in', 'authentication', 'user login'],
);

export const signUpMetadata: Metadata = createPageMetadata(
  'Sign Up',
  'Create a new Evaluate account to start managing interviews professionally',
  '/sign-up',
  ['register', 'sign up', 'create account', 'new account'],
);
