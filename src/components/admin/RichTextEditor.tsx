'use client';

import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import ErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import ToolbarPlugin from './ToolbarPlugin';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

function OnChange({ onChange }: { onChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null);
        onChange(htmlString);
      });
    });
  }, [editor, onChange]);

  return null;
}

function InitialContent({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
    }
  }, [editor, value]);

  return null;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...' }: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'DhammaEditor',
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
      },
      link: 'editor-link',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <div className="rich-text-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<div className="editor-placeholder">{placeholder}</div>}
              ErrorBoundary={ErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
            <OnChange onChange={onChange} />
            <InitialContent value={value} />
          </div>
        </div>
      </LexicalComposer>
      
      <style jsx global>{`
        .rich-text-editor {
          border: 1px solid rgb(209 213 219);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .dark .rich-text-editor {
          border-color: rgb(75 85 99);
        }
        .editor-container {
          position: relative;
        }
        .editor-inner {
          background-color: white;
          position: relative;
          min-height: 300px;
        }
        .dark .editor-inner {
          background-color: rgb(55 65 81);
        }
        .editor-input {
          min-height: 300px;
          resize: none;
          font-size: 16px;
          caret-color: rgb(17 24 39);
          position: relative;
          tab-size: 1;
          outline: 0;
          padding: 15px 10px;
          color: rgb(17 24 39);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .dark .editor-input {
          color: rgb(243 244 246);
          caret-color: rgb(243 244 246);
        }
        .editor-placeholder {
          color: rgb(156 163 175);
          overflow: hidden;
          position: absolute;
          text-overflow: ellipsis;
          top: 15px;
          left: 10px;
          font-size: 16px;
          user-select: none;
          display: inline-block;
          pointer-events: none;
        }
        .dark .editor-placeholder {
          color: rgb(107 114 128);
        }
        .editor-paragraph {
          display: block;
          margin: 0;
          margin-bottom: 8px;
          position: relative;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .editor-paragraph:last-child {
          margin-bottom: 0;
        }
        .editor-heading-h1 {
          font-size: 24px;
          color: rgb(17 24 39);
          font-weight: 400;
          margin: 0;
        }
        .dark .editor-heading-h1 {
          color: rgb(243 244 246);
        }
        .editor-heading-h2 {
          font-size: 20px;
          color: rgb(17 24 39);
          font-weight: 400;
          margin: 0;
        }
        .dark .editor-heading-h2 {
          color: rgb(243 244 246);
        }
        .editor-heading-h3 {
          font-size: 18px;
          color: rgb(17 24 39);
          font-weight: 400;
          margin: 0;
        }
        .dark .editor-heading-h3 {
          color: rgb(243 244 246);
        }
        .editor-list-ol {
          padding: 0;
          margin: 0;
          margin-left: 16px;
        }
        .editor-list-ul {
          padding: 0;
          margin: 0;
          margin-left: 16px;
        }
        .editor-listitem {
          margin: 8px 32px 8px 32px;
        }
        .editor-link {
          color: rgb(37 99 235);
          text-decoration: none;
        }
        .dark .editor-link {
          color: rgb(96 165 250);
        }
        .editor-text-bold {
          font-weight: bold;
        }
        .editor-text-italic {
          font-style: italic;
        }
        .editor-text-underline {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}