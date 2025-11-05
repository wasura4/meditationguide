"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $getRoot } from 'lexical';
import { $createPollNode } from '../nodes/PollNode';
import { useEffect } from 'react';

export const INSERT_POLL_COMMAND: LexicalCommand<{ question: string; options: string[] }> = createCommand('INSERT_POLL_COMMAND');

export default function PollPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_POLL_COMMAND,
      (payload) => {
        const { question, options } = payload;
        editor.update(() => {
          const node = $createPollNode(question, options);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([node]);
          } else {
            $getRoot().append(node);
          }
        });
        return true;
      },
      0
    );
  }, [editor]);

  return null;
}

