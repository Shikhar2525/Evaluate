'use client';

import dynamic from 'next/dynamic';
import { useMemo, Suspense } from 'react';
import 'react-quill/dist/quill.snow.css';

// Loading component for React Quill
function QuillLoader() {
  return (
    <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
      <div className="text-slate-400">Loading editor...</div>
    </div>
  );
}

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: QuillLoader,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  readOnly = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['link', 'image'],
            ['clean'],
          ],
    }),
    [readOnly],
  );

  const formats = [
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'list',
    'script',
    'indent',
    'size',
    'header',
    'link',
    'image',
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          border: 1px solid rgba(63, 154, 174, 0.3);
          border-radius: 0.5rem;
          background-color: rgba(30, 41, 59, 0.5);
          color: white;
        }
        
        .rich-text-editor .ql-toolbar {
          border: 1px solid rgba(63, 154, 174, 0.3);
          border-radius: 0.5rem 0.5rem 0 0;
          background-color: rgba(30, 41, 59, 0.5);
          border-bottom: 1px solid rgba(63, 154, 174, 0.3);
        }
        
        .rich-text-editor .ql-toolbar.ql-snow {
          padding: 8px;
        }
        
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #79C9C5;
        }
        
        .rich-text-editor .ql-snow .ql-fill {
          fill: #79C9C5;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label {
          color: #79C9C5;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-label {
          color: #79C9C5;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow button:hover,
        .rich-text-editor .ql-toolbar.ql-snow button.ql-active,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-label:hover,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item:hover,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item.ql-selected {
          color: #FFE2AF;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar.ql-snow button.ql-active .ql-stroke,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item:hover .ql-stroke,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-stroke {
          stroke: #FFE2AF;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow button:hover .ql-fill,
        .rich-text-editor .ql-toolbar.ql-snow button.ql-active .ql-fill,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-label:hover .ql-fill,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item:hover .ql-fill,
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-fill {
          fill: #FFE2AF;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 120px;
          padding: 12px;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgba(148, 163, 184, 0.6);
        }
        
        .rich-text-editor .ql-editor p {
          margin-bottom: 0.5rem;
        }
      `}</style>
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        theme={readOnly ? 'bubble' : 'snow'}
      />
    </div>
  );
}
