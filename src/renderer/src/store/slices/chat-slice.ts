/**
 * Chat 状态 Slice
 * 管理聊天消息、历史记录、字幕等
 */

import { StateCreator } from 'zustand';
import { ChatState } from '../types';
import { initialChatState } from '../initial-states';

export interface ChatSlice {
  chat: ChatState;
  
  // 消息管理
  addMessage: (message: any) => void;
  clearMessages: () => void;
  setMessages: (messages: any[]) => void;
  appendHumanMessage: (content: string) => void;
  appendAIMessage: (content: string, name?: string, avatar?: string) => void;
  
  // 历史记录管理
  setHistoryList: (list: any[] | ((prev: any[]) => any[])) => void;
  setCurrentHistoryUid: (uid: string | null) => void;
  
  // 字幕管理
  setSubtitleText: (text: string) => void;
  setShowSubtitle: (show: boolean) => void;
  
  // 响应管理
  setFullResponse: (text: string) => void;
  appendResponse: (text: string) => void;
  clearResponse: () => void;
  
  // 其他
  setForceNewMessage: (value: boolean) => void;
  updateChatState: (updates: Partial<ChatState>) => void;
}

export const createChatSlice: StateCreator<
  ChatSlice,
  [['zustand/immer', never]]
> = (set) => ({
  chat: initialChatState,

  // =========================
  // 消息管理
  // =========================
  addMessage: (message) => {
    set((draft) => {
      draft.chat.messages.push(message);
    });
  },

  clearMessages: () => {
    set((draft) => {
      draft.chat.messages = [];
    });
  },

  setMessages: (messages) => {
    set((draft) => {
      draft.chat.messages = messages;
    });
  },

  appendHumanMessage: (content) => {
    set((draft) => {
      draft.chat.messages.push({
        id: Date.now().toString(),
        content,
        role: 'human',
        timestamp: new Date().toISOString(),
      });
    });
  },

  appendAIMessage: (content, name, avatar) => {
    set((draft) => {
      const msgs = draft.chat.messages as any[];
      const last = msgs[msgs.length - 1];
      if (draft.chat.forceNewMessage || !last || last.role !== 'ai') {
        draft.chat.forceNewMessage = false;
        msgs.push({
          id: Date.now().toString(),
          content,
          role: 'ai',
          timestamp: new Date().toISOString(),
          name,
          avatar,
        });
      } else {
        last.content = `${last.content}${content}`;
        last.timestamp = new Date().toISOString();
      }
    });
  },

  // =========================
  // 历史记录管理
  // =========================
  setHistoryList: (list) => {
    set((draft) => {
      draft.chat.historyList = typeof list === 'function' ? (list as any)(draft.chat.historyList) : list;
    });
  },

  setCurrentHistoryUid: (uid) => {
    set((draft) => {
      draft.chat.currentHistoryUid = uid;
    });
  },

  // =========================
  // 字幕管理
  // =========================
  setSubtitleText: (text) => {
    set((draft) => {
      draft.chat.subtitleText = text;
    });
  },

  setShowSubtitle: (show) => {
    set((draft) => {
      draft.chat.showSubtitle = show;
    });
  },

  // =========================
  // 响应管理
  // =========================
  setFullResponse: (text) => {
    set((draft) => {
      draft.chat.fullResponse = text;
    });
  },

  appendResponse: (text) => {
    set((draft) => {
      draft.chat.fullResponse = `${draft.chat.fullResponse}${text || ''}`;
    });
  },

  clearResponse: () => {
    set((draft) => {
      draft.chat.fullResponse = '';
    });
  },

  // =========================
  // 其他
  // =========================
  setForceNewMessage: (value) => {
    set((draft) => {
      draft.chat.forceNewMessage = value;
    });
  },

  updateChatState: (updates) => {
    set((draft) => {
      Object.assign(draft.chat, updates);
    });
  },
});

