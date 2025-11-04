'use client';

import React, { useEffect, useRef } from 'react';

interface SummernoteEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

declare global {
  interface Window {
    $: any;
  }
}

export default function SummernoteEditor({ value, onChange, placeholder = '', height = 300 }: SummernoteEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const summernoteInstance = useRef<any>(null);

  useEffect(() => {
    // Dynamically load Summernote CSS and JS
    const loadSummernote = async () => {
      // Load CSS
      if (!document.getElementById('summernote-css')) {
        const link = document.createElement('link');
        link.id = 'summernote-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css';
        document.head.appendChild(link);
      }

      // Load jQuery (required for Summernote)
      if (!window.$) {
        await new Promise<void>((resolve) => {
          if (document.getElementById('jquery-script')) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.id = 'jquery-script';
          script.src = 'https://code.jquery.com/jquery-3.5.1.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      // Load Summernote JS
      if (!window.$?.fn?.summernote) {
        await new Promise<void>((resolve) => {
          if (document.getElementById('summernote-script')) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.id = 'summernote-script';
          script.src = 'https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      // Initialize Summernote
      if (window.$ && editorRef.current && !summernoteInstance.current) {
        const $editor = window.$(editorRef.current);
        $editor.summernote({
          height: height,
          placeholder: placeholder,
          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']],
          ],
          callbacks: {
            onChange: (content: string) => {
              onChange(content);
            },
            onInit: () => {
              if (value) {
                $editor.summernote('code', value);
              }
            },
          },
        });
        summernoteInstance.current = $editor;
      }
    };

    loadSummernote();

    return () => {
      // Cleanup
      if (summernoteInstance.current) {
        try {
          window.$(summernoteInstance.current).summernote('destroy');
        } catch (e) {
          console.error('Error destroying summernote:', e);
        }
        summernoteInstance.current = null;
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (summernoteInstance.current && value !== summernoteInstance.current.summernote('code')) {
      summernoteInstance.current.summernote('code', value);
    }
  }, [value]);

  return (
    <div className="summernote-wrapper">
      <textarea
        ref={editorRef}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        defaultValue={value}
      />
      <style jsx global>{`
        .note-editor.note-frame {
          border-color: rgb(209 213 219);
          border-radius: 0.5rem;
        }
        .dark .note-editor.note-frame {
          border-color: rgb(75 85 99);
          background-color: rgb(55 65 81);
        }
        .note-editor.note-frame .note-editing-area {
          background-color: white;
        }
        .dark .note-editor.note-frame .note-editing-area {
          background-color: rgb(55 65 81);
        }
        .note-editor.note-frame .note-editing-area .note-editable {
          color: rgb(17 24 39);
          background-color: white;
        }
        .dark .note-editor.note-frame .note-editing-area .note-editable {
          color: rgb(243 244 246);
          background-color: rgb(55 65 81);
        }
        .note-toolbar {
          background-color: rgb(249 250 251);
          border-color: rgb(209 213 219);
        }
        .dark .note-toolbar {
          background-color: rgb(31 41 55);
          border-color: rgb(75 85 99);
        }
        .note-btn-group .note-btn {
          color: rgb(17 24 39);
          background-color: transparent;
        }
        .dark .note-btn-group .note-btn {
          color: rgb(243 244 246);
        }
        .note-btn-group .note-btn:hover {
          background-color: rgb(243 244 246);
        }
        .dark .note-btn-group .note-btn:hover {
          background-color: rgb(55 65 81);
        }
      `}</style>
    </div>
  );
}
