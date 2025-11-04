'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import {
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $createParagraphNode, $getRoot, FORMAT_TEXT_COMMAND } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { useCallback, useEffect, useState } from 'react';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const headingNode = $createHeadingNode(headingSize);
        selection.insertNodes([headingNode]);
      }
    });
  };

  const formatBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const formatNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };


  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url);
          selection.insertNodes([linkNode]);
        }
      });
    }
  };

  const insertYouTube = () => {
    const url = prompt('Enter YouTube video URL:');
    if (url) {
      // Extract video ID
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      
      if (videoId) {
        editor.update(() => {
          const root = $getRoot();
          const paragraph = $createParagraphNode();
          const embed = `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
          paragraph.append(embed);
          root.append(paragraph);
        });
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  return (
    <div className="toolbar">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`toolbar-item ${isBold ? 'active' : ''}`}
        aria-label="Format Bold"
      >
        <span className="format bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`toolbar-item ${isItalic ? 'active' : ''}`}
        aria-label="Format Italics"
      >
        <span className="format italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={`toolbar-item ${isUnderline ? 'active' : ''}`}
        aria-label="Format Underline"
      >
        <span className="format underline">U</span>
      </button>
      <div className="divider" />
      <button
        type="button"
        onClick={() => formatHeading('h1')}
        className="toolbar-item"
        aria-label="Heading 1"
      >
        <span className="format h1">H1</span>
      </button>
      <button
        type="button"
        onClick={() => formatHeading('h2')}
        className="toolbar-item"
        aria-label="Heading 2"
      >
        <span className="format h2">H2</span>
      </button>
      <button
        type="button"
        onClick={() => formatHeading('h3')}
        className="toolbar-item"
        aria-label="Heading 3"
      >
        <span className="format h3">H3</span>
      </button>
      <div className="divider" />
      <button
        type="button"
        onClick={formatBulletList}
        className="toolbar-item"
        aria-label="Bullet List"
      >
        <span className="format bullet-list">• List</span>
      </button>
      <button
        type="button"
        onClick={formatNumberedList}
        className="toolbar-item"
        aria-label="Numbered List"
      >
        <span className="format numbered-list">1. List</span>
      </button>
      <div className="divider" />
      <button
        type="button"
        onClick={insertLink}
        className="toolbar-item"
        aria-label="Insert Link"
      >
        <span className="format link">🔗 Link</span>
      </button>
      <button
        type="button"
        onClick={insertYouTube}
        className="toolbar-item youtube-button"
        aria-label="Insert YouTube Video"
      >
        <span className="format youtube">▶️ YouTube</span>
      </button>
      <style jsx>{`
        .toolbar {
          display: flex;
          gap: 4px;
          padding: 8px;
          border-bottom: 1px solid rgb(209 213 219);
          background-color: rgb(249 250 251);
          flex-wrap: wrap;
        }
        .dark .toolbar {
          border-color: rgb(75 85 99);
          background-color: rgb(31 41 55);
        }
        .toolbar-item {
          padding: 6px 12px;
          border: 1px solid transparent;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: rgb(17 24 39);
          transition: all 0.2s;
        }
        .dark .toolbar-item {
          background-color: rgb(55 65 81);
          color: rgb(243 244 246);
        }
        .toolbar-item:hover {
          background-color: rgb(243 244 246);
        }
        .dark .toolbar-item:hover {
          background-color: rgb(75 85 99);
        }
        .toolbar-item.active {
          background-color: rgb(59 130 246);
          color: white;
        }
        .toolbar-item.youtube-button {
          background-color: rgb(239 68 68);
          color: white;
        }
        .toolbar-item.youtube-button:hover {
          background-color: rgb(220 38 38);
        }
        .divider {
          width: 1px;
          background-color: rgb(209 213 219);
          margin: 0 4px;
        }
        .dark .divider {
          background-color: rgb(75 85 99);
        }
        .format {
          font-weight: 500;
        }
        .format.bold {
          font-weight: bold;
        }
        .format.italic {
          font-style: italic;
        }
        .format.underline {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
