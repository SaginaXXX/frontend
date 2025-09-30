import { ChangeEvent, KeyboardEvent } from 'react';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { useMicToggle } from '@/hooks/utils/use-mic-toggle';
import { useTextInput } from '@/hooks/footer/use-text-input';
import { useAiStore } from '@/store';
import { useInterrupt } from '@/hooks/utils/use-interrupt';

// 过滤AI消息中的标签，如 [neutral], [happy] 等
const filterMessageTags = (text: string): string => {
  return text.replace(/\[[\w\s]*\]/g, '').trim();
};

export function useInputSubtitle() {
  const {
    inputText: inputValue,
    setInputText: handleChange,
    handleKeyPress: handleKey,
    handleCompositionStart,
    handleCompositionEnd,
    handleSend,

  } = useTextInput();

  const { messages } = useChatHistory();
  const { startMic, autoStartMicOn } = useVAD();
  const { handleMicToggle, micOn } = useMicToggle();
  const { status: aiState, setAiState } = useAiStore();
  const { interrupt } = useInterrupt();

  const lastAIMessage = messages
    .filter((msg) => msg.role === 'ai')
    .slice(-1)
    .map((msg) => filterMessageTags(msg.content))[0]; // 过滤掉标签

  const hasAIMessages = messages.some((msg) => msg.role === 'ai');

  const handleInterrupt = () => {
    interrupt();
    if (autoStartMicOn) {
      startMic();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleChange({ target: { value: e.target.value } } as ChangeEvent<HTMLInputElement>);
    setAiState('waiting');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    handleKey(e as any);
  };

  return {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    lastAIMessage,
    hasAIMessages,
    aiState,
    micOn,
    handleSend,
  };
}
