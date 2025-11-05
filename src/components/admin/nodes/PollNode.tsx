"use client";

import * as React from 'react';
import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

type SerializedPollNode = Spread<
  {
    type: 'poll';
    version: 1;
    question: string;
    options: string[];
  },
  SerializedLexicalNode
>;

export class PollNode extends DecoratorNode<React.ReactElement> {
  __question: string;
  __options: string[];

  static getType(): string {
    return 'poll';
  }

  static clone(node: PollNode): PollNode {
    return new PollNode(node.__question, node.__options, node.__key);
  }

  constructor(question: string, options: string[], key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__options = options;
  }

  exportJSON(): SerializedPollNode {
    return {
      type: 'poll',
      version: 1,
      question: this.__question,
      options: this.__options,
    };
  }

  static importJSON(json: SerializedPollNode): PollNode {
    return new PollNode(json.question, json.options);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    return container;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <div className="poll-block rounded-lg border border-border p-3 sm:p-4 bg-background">
        <div className="font-semibold mb-2">{this.__question}</div>
        <ul className="grid gap-2">
          {this.__options.map((opt, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input type="radio" name={`poll-${this.getKey()}`} />
              <span>{opt}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export function $createPollNode(question: string, options: string[]) {
  return new PollNode(question, options);
}

export function $isPollNode(node?: LexicalNode | null): node is PollNode {
  return node instanceof PollNode;
}

