"use client";

import * as React from 'react';
import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';

type SerializedYouTubeNode = Spread<{
  type: 'youtube';
  version: 1;
  videoId: string;
}, SerializedLexicalNode>;

export class YouTubeNode extends DecoratorNode<React.ReactNode> {
  __videoId: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoId, node.__key);
  }

  constructor(videoId: string, key?: NodeKey) {
    super(key);
    this.__videoId = videoId;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      type: 'youtube',
      version: 1,
      videoId: this.__videoId,
    };
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const { videoId } = serializedNode;
    return new YouTubeNode(videoId);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    const src = `https://www.youtube.com/embed/${this.__videoId}`;
    return (
      <div className="youtube-embed aspect-video w-full overflow-hidden rounded-lg border border-border bg-background">
        <iframe
          className="h-full w-full"
          src={src}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
}

export function $createYouTubeNode(videoId: string) {
  return new YouTubeNode(videoId);
}

export function $isYouTubeNode(node?: LexicalNode | null): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
