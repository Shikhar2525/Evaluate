import { ReactNode } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Evaluate',
  description: 'Professional Interview Management System',
  url: 'https://evaluate.app',
  logo: 'https://evaluate.app/favicon.svg',
  sameAs: [
    'https://twitter.com/evaluate',
    'https://linkedin.com/company/evaluate',
    'https://github.com/evaluate',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@evaluate.app',
  },
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const articleSchema = (article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  image: article.image || 'https://evaluate.app/og-image.png',
  author: {
    '@type': 'Person',
    name: article.author,
  },
  datePublished: article.datePublished,
  dateModified: article.dateModified,
});
