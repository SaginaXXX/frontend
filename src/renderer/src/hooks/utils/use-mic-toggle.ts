import { useVAD } from '@/context/vad-context';
import { useAiStore } from '@/store';

export function useMicToggle() {
  const { startMic, stopMic, micOn } = useVAD();
  const { status: aiState, setAiState } = useAiStore();

  const handleMicToggle = async (): Promise<void> => {
    if (micOn) {
      stopMic();
      if (aiState === 'listening') {
        setAiState('idle');
      }
    } else {
      await startMic();
    }
  };

  return {
    handleMicToggle,
    micOn,
  };
}
