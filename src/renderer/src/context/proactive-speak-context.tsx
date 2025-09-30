import {
  createContext, useContext, ReactNode, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useTriggerSpeak } from '@/hooks/utils/use-trigger-speak';
import { useAiStore, useProactiveStore } from '@/store';

interface ProactiveSpeakSettings {
  allowButtonTrigger: boolean;
  allowProactiveSpeak: boolean
  idleSecondsToSpeak: number
}

interface ProactiveSpeakContextType {
  settings: ProactiveSpeakSettings
  updateSettings: (newSettings: ProactiveSpeakSettings) => void
}

const defaultSettings: ProactiveSpeakSettings = {
  allowProactiveSpeak: false,
  idleSecondsToSpeak: 5,
  allowButtonTrigger: false,
};

export const ProactiveSpeakContext = createContext<ProactiveSpeakContextType | null>(null);

export function ProactiveSpeakProvider({ children }: { children: ReactNode }) {
  const { allowProactiveSpeak, allowButtonTrigger, idleSecondsToSpeak, updateProactiveSettings } = useProactiveStore();
  const settings: ProactiveSpeakSettings = {
    allowProactiveSpeak,
    allowButtonTrigger,
    idleSecondsToSpeak,
  };

  const { status: aiState } = useAiStore();
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

    if (!settings.allowProactiveSpeak) return;

    idleStartTimeRef.current = Date.now();
    idleTimerRef.current = setTimeout(() => {
      const actualIdleTime = (Date.now() - idleStartTimeRef.current!) / 1000;
      sendTriggerSignal(actualIdleTime);
    }, settings.idleSecondsToSpeak * 1000);
  }, [settings.allowProactiveSpeak, settings.idleSecondsToSpeak]);

  useEffect(() => {
    if (aiState === 'idle') {
      startIdleTimer();
    } else {
      clearIdleTimer();
    }
  }, [aiState, startIdleTimer, clearIdleTimer]);

  useEffect(() => () => {
    clearIdleTimer();
  }, [clearIdleTimer]);

  const updateSettings = useCallback((newSettings: ProactiveSpeakSettings) => {
    updateProactiveSettings(newSettings);
  }, [updateProactiveSettings]);

  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
  }), [settings, updateSettings]);

  return (
    <ProactiveSpeakContext.Provider value={contextValue}>
      {children}
    </ProactiveSpeakContext.Provider>
  );
}

export const useProactiveSpeak = () => {
  const context = useContext(ProactiveSpeakContext);
  if (!context) {
    throw new Error('useProactiveSpeak must be used within a ProactiveSpeakProvider');
  }
  return context;
}
