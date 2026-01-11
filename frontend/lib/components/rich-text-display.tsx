'use client';

import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export default function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
  if (!content) {
    return <p className={`text-slate-400 italic ${className}`}>No description provided</p>;
  }

  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src'],
  });

  return (
    <>
      <style>{`
        .rich-text-display {
          color: inherit;
        }
        
        .rich-text-display p {
          margin-bottom: 0.75rem;
          color: inherit;
        }
        
        .rich-text-display strong {
          font-weight: 700;
          color: inherit;
        }
        
        .rich-text-display em {
          font-style: italic;
          color: inherit;
        }
        
        .rich-text-display u {
          text-decoration: underline;
          color: inherit;
        }
        
        .rich-text-display s {
          text-decoration: line-through;
          color: inherit;
        }
        
        .rich-text-display h1,
        .rich-text-display h2,
        .rich-text-display h3,
        .rich-text-display h4,
        .rich-text-display h5,
        .rich-text-display h6 {
          margin: 1rem 0 0.5rem 0;
          font-weight: 700;
          color: inherit;
        }
        
        .rich-text-display h1 {
          font-size: 1.875rem;
          line-height: 2.25rem;
        }
        
        .rich-text-display h2 {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        
        .rich-text-display h3 {
          font-size: 1.25rem;
          line-height: 1.75rem;
        }
        
        .rich-text-display h4 {
          font-size: 1.125rem;
          line-height: 1.75rem;
        }
        
        .rich-text-display h5 {
          font-size: 1rem;
          line-height: 1.5rem;
        }
        
        .rich-text-display h6 {
          font-size: 0.875rem;
          line-height: 1.5rem;
        }
        
        .rich-text-display ul {
          list-style-type: disc !important;
          margin: 0.75rem 0 0.75rem 2rem !important;
          padding-left: 1.5rem !important;
          color: inherit;
        }
        
        .rich-text-display ol {
          list-style-type: decimal !important;
          margin: 0.75rem 0 0.75rem 2rem !important;
          padding-left: 1.5rem !important;
          color: inherit;
        }
        
        .rich-text-display li {
          margin-bottom: 0.5rem;
          color: inherit;
          display: list-item !important;
        }
        
        .rich-text-display ul li {
          list-style-type: disc !important;
        }
        
        .rich-text-display ol li {
          list-style-type: decimal !important;
        }
        
        .rich-text-display blockquote {
          border-left: 4px solid #3F9AAE;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: inherit;
          font-style: italic;
        }
        
        .rich-text-display code {
          background-color: rgba(30, 41, 59, 0.8);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
          color: #FFE2AF;
        }
        
        .rich-text-display pre {
          background-color: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(63, 154, 174, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
          color: #e2e8f0;
        }
        
        .rich-text-display pre code {
          background-color: transparent;
          color: #e2e8f0;
          padding: 0;
        }
        
        .rich-text-display a {
          color: #79C9C5;
          text-decoration: underline;
        }
        
        .rich-text-display a:hover {
          color: #FFE2AF;
        }
        
        .rich-text-display img {
          max-width: 100%;
          height: auto;
          margin: 0.75rem 0;
          border-radius: 0.5rem;
        }
        
        .rich-text-display br {
          display: block;
          content: '';
          margin: 0;
        }
      `}</style>
      <div
        className={`rich-text-display ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </>
  );
}
