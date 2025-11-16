/**
 * AI 状态 Slice
 * 管理 AI 交互状态（idle, listening, thinking, speaking等）
 */

import { StateCreator } from 'zustand';
import { AiState } from '../types';
import { initialAiState } from '../initial-states';

export interface AiSlice {
  ai: AiState;
  setAiState: (state: AiState['status'] | ((current: AiState['status']) => AiState['status'])) => void;
  resetAiState: () => void;
}

export const createAiSlice: StateCreator<
  AiSlice,
  [['zustand/immer', never]]
> = (set) => ({
  ai: initialAiState,

  setAiState: (state) => {
    set((draft) => {
      const newStatus = typeof state === 'function' 
        ? state(draft.ai.status) 
        : state;
      
      draft.ai.status = newStatus;
      
      // 更新派生状态
      draft.ai.isIdle = newStatus === 'idle';
      draft.ai.isThinkingSpeaking = newStatus === 'thinking' || newStatus === 'speaking';
      draft.ai.isInterrupted = newStatus === 'interrupted';
      draft.ai.isLoading = newStatus === 'loading';
      draft.ai.isListening = newStatus === 'listening';
      draft.ai.isWaiting = newStatus === 'waiting';
    });
  },

  resetAiState: () => {
    set((draft) => {
      draft.ai = initialAiState;
    });
  },
});

