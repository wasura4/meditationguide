'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        'image': function() {
          const url = prompt('Enter image URL:');
          if (url) {
            const quill = (this as any).quill;
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', url, 'user');
          }
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  // Handle YouTube video embedding
  const handleYouTubeEmbed = () => {
    const url = prompt('Enter YouTube video URL:');
    if (url) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        const embed = `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        
        // Get current editor content and add embed
        const currentContent = value || '';
        const newContent = currentContent + embed;
        onChange(newContent);
      } else {
        alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  return (
    <div className="rich-text-editor" ref={editorRef}>
      <div className="mb-2">
        <button
          type="button"
          onClick={handleYouTubeEmbed}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Embed YouTube Video
        </button>
      </div>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 16px;
          min-height: 300px;
        }
        .rich-text-editor .ql-editor {
          min-height: 300px;
          color: rgb(17 24 39);
        }
        .dark .rich-text-editor .ql-editor {
          color: rgb(243 244 246);
        }
        .rich-text-editor .ql-snow {
          border-color: rgb(209 213 219);
        }
        .dark .rich-text-editor .ql-snow {
          border-color: rgb(75 85 99);
          background-color: rgb(55 65 81);
        }
        .rich-text-editor .ql-toolbar {
          border-color: rgb(209 213 219);
          background-color: rgb(249 250 251);
        }
        .dark .rich-text-editor .ql-toolbar {
          border-color: rgb(75 85 99);
          background-color: rgb(31 41 55);
        }
        .rich-text-editor .ql-stroke {
          stroke: rgb(17 24 39);
        }
        .dark .rich-text-editor .ql-stroke {
          stroke: rgb(243 244 246);
        }
        .rich-text-editor .ql-fill {
          fill: rgb(17 24 39);
        }
        .dark .rich-text-editor .ql-fill {
          fill: rgb(243 244 246);
        }
        .rich-text-editor .ql-picker-label {
          color: rgb(17 24 39);
        }
        .dark .rich-text-editor .ql-picker-label {
          color: rgb(243 244 246);
        }
        .rich-text-editor .youtube-embed {
          margin: 20px 0;
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
        }
        .rich-text-editor .youtube-embed iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}