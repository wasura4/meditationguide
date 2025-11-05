'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import {
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $getRoot, FORMAT_TEXT_COMMAND } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $generateNodesFromDOM } from '@lexical/html';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_POLL_COMMAND } from './plugins/PollPlugin';
import { useCallback, useEffect, useState } from 'react';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
        
        // Check undo/redo availability from editor history
        try {
          const historyState = (editorState as { _history?: { undoStack?: unknown[]; redoStack?: unknown[] } })._history;
          if (historyState) {
            setCanUndo((historyState.undoStack?.length || 0) > 0);
            setCanRedo((historyState.redoStack?.length || 0) > 0);
          }
        } catch {
          // If history state is not accessible, enable buttons (HistoryPlugin will handle it)
          setCanUndo(true);
          setCanRedo(true);
        }
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

    const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: 3,
      columns: 3,
      includeHeaders: false,
    } as unknown as never);
  };

  const insertCollapsible = () => {
    const htmlString = `
      <details class="collapsible"><summary>Section title</summary><div>
        Replace this with your content.
      </div></details>
    `;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlString, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes(nodes);
      } else {
        $getRoot().append(...nodes);
      }
    });
  };

  const insertStickyNote = () => {
    const htmlString = `<div class="sticky-note">Sticky note: jot quick ideas hereÃ¢â‚¬Â¦</div>`;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlString, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes(nodes);
      } else {
        $getRoot().append(...nodes);
      }
    });
  };

  const insertPoll = () => {
  const question = prompt('Poll question:', 'What do you think?');
  if (!question) return;
  const a = prompt('Option 1:', 'Option A');
  const b = prompt('Option 2:', 'Option B');
  const cOpt = prompt('Option 3 (optional):', '') || '';
  const dOpt = prompt('Option 4 (optional):', '') || '';
  const options = [a, b, cOpt, dOpt].filter(Boolean) as string[];
  
  editor.dispatchCommand(INSERT_POLL_COMMAND, { question, options });
};

  const insertHorizontalRule = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
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
          const selection = $getSelection();
          const htmlString = `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
          
          // Parse HTML string into DOM
          const parser = new DOMParser();
          const dom = parser.parseFromString(htmlString, 'text/html');
          
          // Convert DOM to Lexical nodes
          const nodes = $generateNodesFromDOM(editor, dom);
          
          // Insert at selection or append to root
          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodes);
          } else {
            const root = $getRoot();
            root.append(...nodes);
          }
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
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        className="toolbar-item"
        aria-label="Undo"
      >
        <span className="format">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â¶</span>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        className="toolbar-item"
        aria-label="Redo"
      >
        <span className="format">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â·</span>
      </button>
      <div className="divider" />
      <button
        type="button"
        onClick={insertTable}
        className="toolbar-item"
        aria-label="Insert Table"
      >
        <span className="format">Table</span>
      </button>
      <button
        type="button"
        onClick={insertCollapsible}
        className="toolbar-item"
        aria-label="Insert Collapsible"
      >
        <span className="format">Collapsible</span>
      </button>
      <button
        type="button"
        onClick={insertStickyNote}
        className="toolbar-item"
        aria-label="Insert Sticky Note"
      >
        <span className="format">Sticky</span>
      </button>
      <button
        type="button"
        onClick={insertPoll}
        className="toolbar-item"
        aria-label="Insert Poll"
      >
        <span className="format">Poll</span>
      </button>
      <div className="divider" />
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
        <span className="format bullet-list">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ List</span>
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
      <button type="button" onClick={insertTable} className="toolbar-item" aria-label="Insert Table"><span className="format">Table</span></button>
      <button type="button" onClick={insertCollapsible} className="toolbar-item" aria-label="Insert Collapsible"><span className="format">Collapsible</span></button>
      <button type="button" onClick={insertStickyNote} className="toolbar-item" aria-label="Insert Sticky Note"><span className="format">Sticky</span></button>
      <button type="button" onClick={insertPoll} className="toolbar-item" aria-label="Insert Poll"><span className="format">Poll</span></button>
      <button type="button" onClick={insertHorizontalRule} className="toolbar-item" aria-label="Insert Horizontal Rule"><span className="format">â€” HR</span></button>
      <div className="divider" />
      <button
        type="button"
        onClick={insertLink}
        className="toolbar-item"
        aria-label="Insert Link"
      >
        <span className="format link">ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â€ Link</span>
      </button>
      <button
        type="button"
        onClick={insertYouTube}
        className="toolbar-item youtube-button"
        aria-label="Insert YouTube Video"
      >
        <span className="format youtube">Ã¢â€“Â¶Ã¯Â¸Â YouTube</span>
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
        .toolbar-item:hover:not(:disabled) {
          background-color: rgb(243 244 246);
        }
        .dark .toolbar-item:hover:not(:disabled) {
          background-color: rgb(75 85 99);
        }
        .toolbar-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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






