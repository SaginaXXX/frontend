import { useCallback } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useConfig } from '@/context/character-config-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useVAD } from '@/context/vad-context';
import { useChatStore, useAiStore, useAppStore } from '@/store';

export function useSwitchCharacter() {
  const { sendMessage } = useWebSocket();
  const { confName, getFilenameByName } = useConfig();
  const { interrupt } = useInterrupt();
  const { stopMic } = useVAD();
  const { setSubtitleText } = useChatStore();
  const { setAiState } = useAiStore();
  // ✅ 直接从 useAppStore 获取 action，避免订阅不需要的状态
  const setLive2DModelInfo = useAppStore((s) => s.setLive2DModelInfo);
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
    setLive2DModelInfo(undefined);
    sendMessage({
      type: 'switch-config',
      file: fileName,
    });
    console.log('Switch Character fileName: ', fileName);
  }, [confName, getFilenameByName, sendMessage, interrupt, stopMic, setSubtitleText, setAiState, setLive2DModelInfo]);

  return { switchCharacter };
}
