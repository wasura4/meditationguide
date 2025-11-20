/**
 * Native Bridge Hook
 *
 * Provides a clean interface for communicating with native Android/iOS code.
 * Automatically detects platform and falls back gracefully if not in native webview.
 */

import { useCallback } from 'react';
import { IOSBridgeMessage } from '@/types/native-bridge';

interface MeditationEventData {
  durationMinutes: number;
  typeName: string;
  typeId: string;
}

export function useNativeBridge() {
  /**
   * Check if running in native Android webview
   */
  const isAndroid = useCallback((): boolean => {
    return typeof window !== 'undefined' && typeof window.Android !== 'undefined';
  }, []);

  /**
   * Check if running in native iOS webview
   */
  const isIOS = useCallback((): boolean => {
    return typeof window !== 'undefined' && typeof window.webkit?.messageHandlers !== 'undefined';
  }, []);

  /**
   * Check if running in any native webview
   */
  const isNative = useCallback((): boolean => {
    return isAndroid() || isIOS();
  }, [isAndroid, isIOS]);

  /**
   * Send message to iOS via webkit message handler
   */
  const sendIOSMessage = useCallback((handlerName: string, message: IOSBridgeMessage) => {
    try {
      const handler = window.webkit?.messageHandlers?.[handlerName as keyof typeof window.webkit.messageHandlers];
      if (handler && 'postMessage' in handler) {
        handler.postMessage(message);
        console.log(`[Native Bridge - iOS] Sent ${handlerName}:`, message);
      }
    } catch (error) {
      console.error(`[Native Bridge - iOS] Error sending ${handlerName}:`, error);
    }
  }, []);

  /**
   * Notify native app that meditation has started
   */
  const notifyMeditationStart = useCallback((data: MeditationEventData) => {
    if (isAndroid()) {
      try {
        window.Android?.onMeditationStart(data.durationMinutes, data.typeName, data.typeId);
        console.log('[Native Bridge - Android] Meditation started:', data);
      } catch (error) {
        console.error('[Native Bridge - Android] Error notifying start:', error);
      }
    } else if (isIOS()) {
      sendIOSMessage('onMeditationStart', {
        action: 'start',
        durationMinutes: data.durationMinutes,
        typeName: data.typeName,
        typeId: data.typeId,
      });
    }
  }, [isAndroid, isIOS, sendIOSMessage]);

  /**
   * Notify native app that meditation has completed
   */
  const notifyMeditationComplete = useCallback((data: MeditationEventData) => {
    if (isAndroid()) {
      try {
        window.Android?.onMeditationComplete(data.durationMinutes, data.typeName, data.typeId);
        console.log('[Native Bridge - Android] Meditation completed:', data);
      } catch (error) {
        console.error('[Native Bridge - Android] Error notifying completion:', error);
      }
    } else if (isIOS()) {
      sendIOSMessage('onMeditationComplete', {
        action: 'complete',
        durationMinutes: data.durationMinutes,
        typeName: data.typeName,
        typeId: data.typeId,
      });
    }
  }, [isAndroid, isIOS, sendIOSMessage]);

  /**
   * Notify native app that meditation has been paused
   */
  const notifyMeditationPause = useCallback((elapsedSeconds: number, remainingSeconds: number) => {
    if (isAndroid()) {
      try {
        window.Android?.onMeditationPause(elapsedSeconds, remainingSeconds);
        console.log('[Native Bridge - Android] Meditation paused:', { elapsedSeconds, remainingSeconds });
      } catch (error) {
        console.error('[Native Bridge - Android] Error notifying pause:', error);
      }
    } else if (isIOS()) {
      sendIOSMessage('onMeditationPause', {
        action: 'pause',
        elapsedSeconds,
        remainingSeconds,
      });
    }
  }, [isAndroid, isIOS, sendIOSMessage]);

  /**
   * Notify native app that meditation has been resumed
   */
  const notifyMeditationResume = useCallback((remainingSeconds: number) => {
    if (isAndroid()) {
      try {
        window.Android?.onMeditationResume(remainingSeconds);
        console.log('[Native Bridge - Android] Meditation resumed:', { remainingSeconds });
      } catch (error) {
        console.error('[Native Bridge - Android] Error notifying resume:', error);
      }
    } else if (isIOS()) {
      sendIOSMessage('onMeditationResume', {
        action: 'resume',
        remainingSeconds,
      });
    }
  }, [isAndroid, isIOS, sendIOSMessage]);

  /**
   * Notify native app that meditation has been stopped
   */
  const notifyMeditationStop = useCallback((elapsedSeconds: number) => {
    if (isAndroid()) {
      try {
        window.Android?.onMeditationStop(elapsedSeconds);
        console.log('[Native Bridge - Android] Meditation stopped:', { elapsedSeconds });
      } catch (error) {
        console.error('[Native Bridge - Android] Error notifying stop:', error);
      }
    } else if (isIOS()) {
      sendIOSMessage('onMeditationStop', {
        action: 'stop',
        elapsedSeconds,
      });
    }
  }, [isAndroid, isIOS, sendIOSMessage]);

  return {
    isAndroid,
    isIOS,
    isNative,
    notifyMeditationStart,
    notifyMeditationComplete,
    notifyMeditationPause,
    notifyMeditationResume,
    notifyMeditationStop,
  };
}
