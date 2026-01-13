// SEO Helper Functions and Constants

export const SEO_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://evaluate.app',
  siteTitle: 'Evaluate - Professional Interview Management System',
  siteDescription: 'Streamline your interview process with advanced templates and feedback tools',
  socialImage: '/og-image.png',
  language: 'en',
  locale: 'en_US',
};

// Utility to generate canonical URLs
export const getCanonicalUrl = (path: string = ''): string => {
  const baseUrl = SEO_CONFIG.baseUrl.replace(/\/$/, '');
  const pathname = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${pathname}`;
};

// Generate JSON-LD schema for webpage
export const generateWebPageSchema = (title: string, description: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': url,
  url,
  name: title,
  description,
  isPartOf: {
    '@id': `${SEO_CONFIG.baseUrl}/#website`,
  },
  potentialAction: {
    '@type': 'ReadAction',
    target: [url],
  },
});

// Generate JSON-LD schema for website
export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SEO_CONFIG.baseUrl}/#website`,
  url: SEO_CONFIG.baseUrl,
  name: SEO_CONFIG.siteTitle,
  description: SEO_CONFIG.siteDescription,
  inLanguage: SEO_CONFIG.language,
  publisher: {
    '@id': `${SEO_CONFIG.baseUrl}/#organization`,
  },
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  ],
});

// Generate JSON-LD schema for organization
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SEO_CONFIG.baseUrl}/#organization`,
  name: 'Evaluate',
  url: SEO_CONFIG.baseUrl,
  logo: {
    '@type': 'ImageObject',
    inLanguage: SEO_CONFIG.language,
    '@id': `${SEO_CONFIG.baseUrl}/#/schema/logo/image/`,
    url: `${SEO_CONFIG.baseUrl}/favicon.svg`,
    contentUrl: `${SEO_CONFIG.baseUrl}/favicon.svg`,
    width: 512,
    height: 512,
  },
  image: {
    '@id': `${SEO_CONFIG.baseUrl}/#/schema/logo/image/`,
  },
  sameAs: [
    'https://twitter.com/evaluate',
    'https://linkedin.com/company/evaluate',
  ],
  description: SEO_CONFIG.siteDescription,
});

// Generate meta tags for social media
export const generateSocialMetaTags = (
  title: string,
  description: string,
  image: string = SEO_CONFIG.socialImage,
  url: string = SEO_CONFIG.baseUrl,
) => ({
  'og:type': 'website',
  'og:title': title,
  'og:description': description,
  'og:image': image,
  'og:url': url,
  'twitter:card': 'summary_large_image',
  'twitter:title': title,
  'twitter:description': description,
  'twitter:image': image,
});

// Keywords for different page types
export const PAGE_KEYWORDS = {
  dashboard: ['interview analytics', 'dashboard', 'interview stats', 'performance metrics', 'hiring metrics'],
  templates: ['interview templates', 'question templates', 'template management', 'interview questions'],
  interviews: ['interview management', 'candidate interviews', 'interview tracking', 'interview scheduling'],
  signIn: ['login', 'sign in', 'user authentication'],
  signUp: ['register', 'sign up', 'create account'],
};

// Slugify utility for SEO
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
};

// Pagination helper for SEO
export const generatePaginationSchema = (
  currentPage: number,
  totalPages: number,
  baseUrl: string,
) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
  };

  if (currentPage > 1) {
    schema.previousPage = `${baseUrl}?page=${currentPage - 1}`;
  }

  if (currentPage < totalPages) {
    schema.nextPage = `${baseUrl}?page=${currentPage + 1}`;
  }

  return schema;
};
