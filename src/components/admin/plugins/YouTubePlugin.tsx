"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createCommand, LexicalCommand, $getSelection, $isRangeSelection, $getRoot } from 'lexical';
import { $createYouTubeNode } from '../nodes/YouTubeNode';
import { useEffect } from 'react';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand('INSERT_YOUTUBE_COMMAND');

export default function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (videoId) => {
        editor.update(() => {
          const node = $createYouTubeNode(videoId);
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
