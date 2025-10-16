  import { useAiStore, useChatStore } from '@/store';
  import { useWebSocket } from '@/context/websocket-context';
  import { useChatHistory } from '@/context/chat-history-context';
  import { audioTaskQueue } from '@/utils/task-queue';
  import { useLive2DModel } from '@/context/live2d-model-context';

  export const useInterrupt = () => {
    const { status: aiState, setAiState } = useAiStore();
    const { sendMessage } = useWebSocket();
    const { fullResponse, clearResponse } = useChatHistory();
    const { currentModel } = useLive2DModel();
    const { subtitleText, setSubtitleText } = useChatStore();

    const interrupt = (sendSignal = true) => {
      if (aiState !== 'thinking' && aiState !== 'speaking') return;
      console.log('Interrupting conversation chain');
      if (sendSignal) {
        sendMessage({
          type: 'interrupt-signal',
          text: fullResponse,
        });
      }
      setAiState('interrupted');
      audioTaskQueue.clearQueue();
      if (currentModel) {
        currentModel.stopSpeaking();
      } else {
        console.error('Live2D model is not initialized');
      }
      clearResponse();
      if (subtitleText === '考え中...') {
        setSubtitleText('');
      }
      console.log('Interrupted!');
    };

    return { interrupt };
  };
