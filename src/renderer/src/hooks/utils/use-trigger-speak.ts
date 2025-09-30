import { useCallback } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useMediaCapture } from './use-media-capture';

export function useTriggerSpeak() {
  const { sendMessage } = useWebSocket();
  void useMediaCapture; // Image capture disabled

  const sendTriggerSignal = useCallback(
    async (actualIdleTime: number) => {
      sendMessage({
        type: "ai-speak-signal",
        idle_time: actualIdleTime,
      });
    },
    [sendMessage],
  );

  return {
    sendTriggerSignal,
  };
}
