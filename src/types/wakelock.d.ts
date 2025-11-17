// Wake Lock API type declarations
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: WakeLock;
}
