'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import YouTube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
// Collapsible handled via raw <details> HTML insertion for v3

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ value, onChange, placeholder = 'Write your content...' }: TiptapEditorProps) {
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      YouTube.configure({ controls: true, modestBranding: true, nocookie: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[220px]'
      }
    }
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
  }, [editor, value]);

  const promptForLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertYouTube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter YouTube URL');
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  const insertSticky = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent('<div class="rounded-lg p-4 bg-amber-50 border border-amber-200" data-type="sticky">Sticky note...</div>')
      .run();
  }, [editor]);

  const insertPoll = useCallback(() => {
    if (!editor) return;
    const question = window.prompt('Poll question');
    if (!question) return;
    const options = window.prompt('Comma-separated options', 'Yes,No');
    const opts = options ? options.split(',').map(s => s.trim()).filter(Boolean) : ['Yes', 'No'];
    const list = opts.map(o => `<li class="py-1">${o}</li>`).join('');
    const html = `<div class="rounded-lg p-4 bg-slate-50 border border-slate-200" data-type="poll"><p class="font-semibold">${question}</p><ul class="list-disc pl-6">${list}</ul></div>`;
    editor.chain().focus().insertContent(html).run();
  }, [editor]);

  const insertCollapsible = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent('<details open><summary class="cursor-pointer font-medium">Details</summary><div>Collapsible content...</div></details>').run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="p-3 text-center text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted">
        {/* Headings */}
        <button type="button" className="px-2 py-1 text-sm rounded hover:bg-muted" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className="px-2 py-1 text-sm rounded hover:bg-muted" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="px-2 py-1 text-sm rounded hover:bg-muted" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        {/* Inline */}
        <button type="button" className="px-2 py-1 text-sm font-semibold hover:bg-muted" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className="px-2 py-1 text-sm italic hover:bg-muted" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className="px-2 py-1 text-sm underline hover:bg-muted" onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={promptForLink}>Link</button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        {/* Lists */}
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        {/* Align */}
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().setTextAlign('left').run()}>Left</button>
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().setTextAlign('center').run()}>Center</button>
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().setTextAlign('right').run()}>Right</button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        {/* Undo/Redo */}
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" className="px-2 py-1 text-sm hover:bg-muted" onClick={() => editor.chain().focus().redo().run()}>Redo</button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        {/* Insert menu */}
        <div
          className="relative"
          onMouseEnter={() => setIsInsertMenuOpen(true)}
          onMouseLeave={() => setIsInsertMenuOpen(false)}
        >
          <button type="button"
            className="px-2 py-1 text-sm rounded hover:bg-muted"
            onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
          >
            Insert ▾
          </button>
          {isInsertMenuOpen && (
            <div className="absolute z-50 mt-0 min-w-[180px] rounded border bg-card shadow-lg">
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-t"
                onClick={() => { insertTable(); setIsInsertMenuOpen(false); }}
              >
                Table
              </button>
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => { editor.chain().focus().setHorizontalRule().run(); setIsInsertMenuOpen(false); }}
              >
                Horizontal Rule
              </button>
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => { insertCollapsible(); setIsInsertMenuOpen(false); }}
              >
                Collapsible
              </button>
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => { insertSticky(); setIsInsertMenuOpen(false); }}
              >
                Sticky Note
              </button>
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => { insertPoll(); setIsInsertMenuOpen(false); }}
              >
                Poll
              </button>
              <button type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-b"
                onClick={() => { insertYouTube(); setIsInsertMenuOpen(false); }}
              >
                YouTube
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
