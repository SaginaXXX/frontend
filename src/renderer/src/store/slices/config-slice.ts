/**
 * Configuration 状态 Slice
 * 管理网络配置、角色配置、应用配置等
 */

import { StateCreator } from 'zustand';
import { ConfigurationState, ConfigFile, ProactiveSpeakState } from '../types';
import { initialConfigState, initialProactiveState } from '../initial-states';

export interface ConfigSlice {
  config: ConfigurationState;
  proactive: ProactiveSpeakState;
  backendSynthComplete: boolean;
  
  // 网络配置
  updateNetworkConfig: (config: { wsUrl?: string; baseUrl?: string }) => void;
  setModelInfo: (info: any) => void;
  updateAppConfig: (config: any) => void;
  setBackendSynthComplete: (complete: boolean) => void;
  
  // 角色配置
  setCharacterConfName: (name: string) => void;
  setCharacterConfUid: (uid: string) => void;
  setCharacterConfigFiles: (files: ConfigFile[]) => void;
  updateCharacterConfig: (config: Partial<ConfigurationState['character']>) => void;
  
  // ProactiveSpeak
  updateProactiveSettings: (s: Partial<ProactiveSpeakState>) => void;
  
  // 工具方法
  resetAll: () => void;
  getSnapshot: () => any;
}

export const createConfigSlice: StateCreator<
  ConfigSlice,
  [['zustand/immer', never]]
> = (set, get) => ({
  config: initialConfigState,
  proactive: initialProactiveState,
  backendSynthComplete: false,

  // =========================
  // 网络配置
  // =========================
  updateNetworkConfig: (config) => {
    set((draft) => {
      if (config.wsUrl) draft.config.wsUrl = config.wsUrl;
      if (config.baseUrl) draft.config.baseUrl = config.baseUrl;
    });
  },

  setModelInfo: (info) => {
    set((draft) => {
      draft.config.modelInfo = info;
    });
  },

  updateAppConfig: (config) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.config.appConfig) {
        draft.config.appConfig = {};
      }
      Object.assign(draft.config.appConfig, config);
    });
  },

  setBackendSynthComplete: (complete) => {
    set((draft) => {
      draft.backendSynthComplete = complete;
    });
  },

  // =========================
  // 角色配置
  // =========================
  setCharacterConfName: (name) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.config.character) {
        draft.config.character = { confName: '', confUid: '', configFiles: [] };
      }
      draft.config.character.confName = name;
    });
  },

  setCharacterConfUid: (uid) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.config.character) {
        draft.config.character = { confName: '', confUid: '', configFiles: [] };
      }
      draft.config.character.confUid = uid;
    });
  },

  setCharacterConfigFiles: (files) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.config.character) {
        draft.config.character = { confName: '', confUid: '', configFiles: [] };
      }
      draft.config.character.configFiles = files;
    });
  },

  updateCharacterConfig: (config) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.config.character) {
        draft.config.character = { confName: '', confUid: '', configFiles: [] };
      }
      Object.assign(draft.config.character, config);
    });
  },

  // =========================
  // ProactiveSpeak
  // =========================
  updateProactiveSettings: (s) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.proactive) {
        draft.proactive = initialProactiveState;
      }
      Object.assign(draft.proactive, s);
    });
  },

  // =========================
  // 工具方法
  // =========================
  resetAll: () => {
    set((draft) => {
      // 注意：这里需要导入其他 slices 的初始状态
      // 由于循环依赖问题，这个方法在主 index.ts 中实现
      draft.config = initialConfigState;
      draft.proactive = initialProactiveState;
      draft.backendSynthComplete = false;
    });
  },

  getSnapshot: () => {
    const state = get() as any;
    return {
      ai: state.ai,
      vad: state.vad,
      media: state.media,
      chat: state.chat,
      config: state.config,
      proactive: state.proactive,
      backendSynthComplete: state.backendSynthComplete,
    };
  },
});

