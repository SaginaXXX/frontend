import { useCallback } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useConfig } from '@/context/character-config-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useVAD } from '@/context/vad-context';
import { useChatStore, useAiStore } from '@/store';
import { useLive2DConfig } from '@/context/live2d-config-context';

export function useSwitchCharacter() {
  const { sendMessage } = useWebSocket();
  const { confName, getFilenameByName } = useConfig();
  const { interrupt } = useInterrupt();
  const { stopMic } = useVAD();
  const { setSubtitleText } = useChatStore();
  const { setAiState } = useAiStore();
  const { setModelInfo } = useLive2DConfig();
  const switchCharacter = useCallback((fileName: string) => {
    const currentFilename = getFilenameByName(confName);

    if (currentFilename === fileName) {
      console.log('Skipping character switch - same configuration file');
      return;
    }

    setSubtitleText('新しいキャラクターを読み込み中...');
    interrupt();
    stopMic();
    setAiState('loading');
    setModelInfo(undefined);
    sendMessage({
      type: 'switch-config',
      file: fileName,
    });
    console.log('Switch Character fileName: ', fileName);
  }, [confName, getFilenameByName, sendMessage, interrupt, stopMic, setSubtitleText, setAiState]);

  return { switchCharacter };
}
