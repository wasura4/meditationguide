/**
 * Native Bridge Type Definitions
 *
 * This file defines TypeScript interfaces for communication between
 * the web app and native Android/iOS code.
 */

/**
 * Android Bridge Interface
 * Injected by Android WebView as window.Android
 */
export interface AndroidBridge {
  /**
   * Called when meditation timer starts
   * @param durationMinutes - Duration of meditation in minutes
   * @param typeName - Name of meditation type (e.g., "Mindfulness", "Loving-Kindness")
   * @param typeId - ID of meditation type
   */
  onMeditationStart(
    durationMinutes: number,
    typeName: string,
    typeId: string,
  ): void;

  /**
   * Called when meditation timer completes successfully
   * @param durationMinutes - Actual duration completed in minutes
   * @param typeName - Name of meditation type
   * @param typeId - ID of meditation type
   */
  onMeditationComplete(
    durationMinutes: number,
    typeName: string,
    typeId: string,
  ): void;

  /**
   * Called when meditation timer is paused
   * @param elapsedSeconds - Elapsed time in seconds
   * @param remainingSeconds - Remaining time in seconds
   */
  onMeditationPause(elapsedSeconds: number, remainingSeconds: number): void;

  /**
   * Called when meditation timer is resumed
   * @param remainingSeconds - Remaining time in seconds
   */
  onMeditationResume(remainingSeconds: number): void;

  /**
   * Called when meditation timer is stopped/cancelled
   * @param elapsedSeconds - Time elapsed before stopping
   */
  onMeditationStop(elapsedSeconds: number): void;
}

/**
 * iOS Bridge Interface
 * Accessed via window.webkit.messageHandlers
 */
export interface IOSMessageHandler {
  postMessage(message: IOSBridgeMessage): void;
}

export interface IOSBridge {
  messageHandlers: {
    syncPractice?: { postMessage(message: unknown): void };
    onMeditationStart?: IOSMessageHandler;
    onMeditationComplete?: IOSMessageHandler;
    onMeditationPause?: IOSMessageHandler;
    onMeditationResume?: IOSMessageHandler;
    onMeditationStop?: IOSMessageHandler;
  };
}

/**
 * iOS Bridge Message Format
 */
export interface IOSBridgeMessage {
  action: "start" | "complete" | "pause" | "resume" | "stop";
  durationMinutes?: number;
  typeName?: string;
  typeId?: string;
  elapsedSeconds?: number;
  remainingSeconds?: number;
  sessionId?: string;
  bell?: boolean;
}

/**
 * Augment Window interface to include native bridges
 */
declare global {
  interface Window {
    AndroidInterface?: { syncPractice?: (payload: string) => void };
    Android?: AndroidBridge;
    webkit?: IOSBridge;
  }
}

export {};
