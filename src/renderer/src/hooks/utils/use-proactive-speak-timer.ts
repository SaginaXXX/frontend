import { useEffect, useRef, useCallback } from 'react';
import { useTriggerSpeak } from '@/hooks/utils/use-trigger-speak';
import { useAiStore, useProactiveStore } from '@/store';

/**
 * Hook to manage proactive speak idle timer
 * Monitors AI state and triggers proactive speak after idle period
 */
export function useProactiveSpeakTimer() {
  const { status: aiState } = useAiStore();
  const { allowProactiveSpeak, idleSecondsToSpeak } = useProactiveStore();
  const { sendTriggerSignal } = useTriggerSpeak();

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleStartTimeRef = useRef<number | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    idleStartTimeRef.current = null;
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();

    if (!allowProactiveSpeak) return;

    idleStartTimeRef.current = Date.now();
    idleTimerRef.current = setTimeout(() => {
      const actualIdleTime = (Date.now() - idleStartTimeRef.current!) / 1000;
      sendTriggerSignal(actualIdleTime);
    }, idleSecondsToSpeak * 1000);
  }, [allowProactiveSpeak, idleSecondsToSpeak, sendTriggerSignal, clearIdleTimer]);

  // Monitor AI state changes
  useEffect(() => {
    if (aiState === 'idle') {
      startIdleTimer();
    } else {
      clearIdleTimer();
    }
  }, [aiState, startIdleTimer, clearIdleTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIdleTimer();
    };
  }, [clearIdleTimer]);
}

