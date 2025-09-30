import { useMemo } from 'react';
import { useChatStore } from '@/store';

// 过滤字幕中的标签，如 [neutral], [happy] 等
const filterSubtitleTags = (text: string): string => {
  return text.replace(/\[[\w\s]*\]/g, '').trim();
};

export const useSubtitleDisplay = () => {
  const { subtitleText: rawText } = useChatStore();

  const subtitleText = useMemo(() => {
    if (!rawText) return null;
    return filterSubtitleTags(rawText);
  }, [rawText]);

  return {
    subtitleText,
    isLoaded: true,
  };
};
