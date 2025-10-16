/**
 * 企业级Zustand状态管理架构
 * 基于最新最佳实践设计的统一状态管理系统
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// import { resourceManager } from '@/utils/resource-manager';
// import { errorHandler } from '@/utils/error-handler';

// ✅ 动态获取环境配置（避免在部署环境使用硬编码的本地地址）
function getInitialServerConfig() {
  try {
    // 检测当前环境
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // HTTPS 环境：使用同源 WSS
      const host = window.location.host;
      return {
        wsUrl: `wss://${host}/client-ws`,
        baseUrl: `https://${host}`
      };
    }
  } catch (e) {
    console.warn('⚠️ 环境检测失败，使用默认配置');
  }
  
  // 默认：开发环境本地地址
  return {
    wsUrl: 'ws://127.0.0.1:12393/client-ws',
    baseUrl: 'http://127.0.0.1:12393'
  };
}

const initialServerConfig = getInitialServerConfig();

// =========================
// 状态类型定义
// =========================

export interface AiState {
  status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'waiting' | 'loading';
  isIdle: boolean;
  isThinkingSpeaking: boolean;
  isInterrupted: boolean;
  isLoading: boolean;
  isListening: boolean;
  isWaiting: boolean;
}

export interface VADState {
  // 麦克风相关
  micOn: boolean; // 麦克风开关
  autoStopMic: boolean; // 自动停止麦克风
  autoStartMicOn: boolean; // 自动启动麦克风
  autoStartMicOnConvEnd: boolean; // 对话结束时自动启动麦克风
  previousTriggeredProbability: number;
  settings: {
    positiveSpeechThreshold: number; // 正向语音阈值
    negativeSpeechThreshold: number; // 负向语音阈值
    redemptionFrames: number; // 重置帧数
    frameSamples: number; // 帧样本
    minSpeechFrames: number; // 最小语音帧数
    vadMode: number; // VAD模式
  };
}

export interface MediaState {
  // Live2D相关
  currentModel: any | null;
  
  // 背景相关
  backgroundUrl: string;
  backgroundFiles: any[];
  useCameraBackground: boolean;
  
  // 摄像头相关
  stream: MediaStream | null;
  isStreaming: boolean;
  
  // 广告相关
  showAdvertisements: boolean;
  currentAdIndex: number;
  advertisements: any[];
  isAdPlaying: boolean;
  
  // 洗衣店相关
  isLaundryMode: boolean;
  currentVideo: string | null;
  videoTitle: string;
  isVideoPlaying: boolean;
  availableMachines: any[];
  isIdle: boolean;
  idleTimeout: number;
  autoCloseEnabled: boolean;
  autoCloseDelay: number;
}

// 聊天相关
export interface ChatState {
  messages: any[];
  historyList: any[];
  currentHistoryUid: string | null;
  subtitleText: string;
  showSubtitle: boolean;
  fullResponse: string;
  forceNewMessage: boolean;
  
  // 群聊相关
  groupMembers: any[];
  isOwner: boolean;
  selfUid: string;
}

export interface ConfigurationState {
  // 模型配置
  modelInfo: any | null;
  
  // 角色配置
  characterConfig: any | null;
  
  // 网络配置
  wsUrl: string;
  baseUrl: string;
  wsState: string;
  
  // 应用配置
  appConfig: any;
}

export interface ProactiveSpeakState {
  allowButtonTrigger: boolean;
  allowProactiveSpeak: boolean;
  idleSecondsToSpeak: number;
}

// =========================
// 统一状态接口
// =========================

export interface AppStore {
  // 状态分片
  ai: AiState;
  vad: VADState;
  media: MediaState;
  chat: ChatState;
  config: ConfigurationState;
  proactive: ProactiveSpeakState;
  backendSynthComplete: boolean;
  
  // AI状态管理
  setAiState: (state: AiState['status'] | ((current: AiState['status']) => AiState['status'])) => void;
  resetAiState: () => void;
  
  // VAD管理
  updateVADSettings: (settings: Partial<VADState['settings']>) => void;
  setMicState: (micOn: boolean) => void;
  setAutoStopMic: (value: boolean) => void;
  setAutoStartMicOn: (value: boolean) => void;
  setAutoStartMicOnConvEnd: (value: boolean) => void;
  
  // 媒体管理
  setCurrentModel: (model: any) => void;
  updateMediaState: (updates: Partial<MediaState>) => void;
  setBackgroundUrl: (url: string) => void;
  setBackgroundFiles: (files: any[]) => void;
  setUseCameraBackground: (use: boolean) => void;
  setShowAdvertisements: (show: boolean) => void;
  setAdvertisements: (ads: any[]) => void;
  // 洗衣店
  setIsLaundryMode: (enabled: boolean) => void;
  setCurrentVideo: (videoPath: string | null, title?: string) => void;
  setAvailableMachines: (machines: any[]) => void;
  
  // 聊天管理
  addMessage: (message: any) => void;
  clearMessages: () => void;
  setMessages: (messages: any[]) => void;
  setHistoryList: (list: any[] | ((prev: any[]) => any[])) => void;
  setCurrentHistoryUid: (uid: string | null) => void;
  setForceNewMessage: (value: boolean) => void;
  appendHumanMessage: (content: string) => void;
  appendAIMessage: (content: string, name?: string, avatar?: string) => void;
  setSubtitleText: (text: string) => void;
  setShowSubtitle: (show: boolean) => void;
  setFullResponse: (text: string) => void;
  appendResponse: (text: string) => void;
  clearResponse: () => void;
  updateChatState: (updates: Partial<ChatState>) => void;
  
  // 配置管理
  updateNetworkConfig: (config: { wsUrl?: string; baseUrl?: string }) => void;
  setModelInfo: (info: any) => void;
  updateAppConfig: (config: any) => void;
  setBackendSynthComplete: (complete: boolean) => void;

  // ProactiveSpeak
  updateProactiveSettings: (s: Partial<ProactiveSpeakState>) => void;
  
  // 工具方法
  resetAll: () => void;
  getSnapshot: () => Partial<AppStore>;
}

// =========================
// 初始状态定义
// =========================

const initialAiState: AiState = {
  status: 'idle',
  isIdle: true,
  isThinkingSpeaking: false,
  isInterrupted: false,
  isLoading: false,
  isListening: false,
  isWaiting: false,
};

const initialVADState: VADState = {
  micOn: false,
  autoStopMic: true,              // ✅ 默认开启：AI说话时自动停止麦克风
  autoStartMicOn: false,          // 保持 false：AI中断时不自动开启（避免误触发）
  autoStartMicOnConvEnd: true,    // ✅ 默认开启：对话结束时自动启动麦克风
  previousTriggeredProbability: 0,
  settings: {
    positiveSpeechThreshold: 30,
    negativeSpeechThreshold: 30,
    redemptionFrames: 8,
    frameSamples: 1536,
    minSpeechFrames: 4,
    vadMode: 3,
  },
};

const initialMediaState: MediaState = {
  currentModel: null,
  backgroundUrl: '',
  backgroundFiles: [],
  useCameraBackground: false,
  stream: null,
  isStreaming: false,
  showAdvertisements: true,
  currentAdIndex: 0,
  advertisements: [],
  isAdPlaying: false,
  isLaundryMode: false,
  currentVideo: null,
  videoTitle: '',
  isVideoPlaying: false,
  availableMachines: [],
  isIdle: false,
  idleTimeout: 60000,
  autoCloseEnabled: true,
  autoCloseDelay: 3000,
};

const initialChatState: ChatState = {
  messages: [],
  historyList: [],
  currentHistoryUid: null,
  subtitleText: '',
  showSubtitle: true,
  fullResponse: '',
  forceNewMessage: false,
  groupMembers: [],
  isOwner: false,
  selfUid: '',
};

const initialConfigState: ConfigurationState = {
  modelInfo: null, // 模型信息
  characterConfig: null, // 角色配置
  wsUrl: initialServerConfig.wsUrl, // ✅ WebSocket URL - 根据环境自动检测
  baseUrl: initialServerConfig.baseUrl, // ✅ Base URL - 根据环境自动检测
  wsState: 'CLOSED', // WebSocket状态
  appConfig: {}, // 应用配置
};

const initialProactiveState: ProactiveSpeakState = {
  allowButtonTrigger: false,
  allowProactiveSpeak: false,
  idleSecondsToSpeak: 5,
};

// =========================
// 主要Store创建
// =========================

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // 初始状态
          ai: initialAiState,
          vad: initialVADState,
          media: initialMediaState,
          chat: initialChatState,
          config: initialConfigState,
          proactive: initialProactiveState,
          backendSynthComplete: false,

          // =========================
          // AI状态管理Actions
          // =========================
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

          // =========================
          // VAD管理Actions
          // =========================
          updateVADSettings: (settings) => {
            set((draft) => {
              Object.assign(draft.vad.settings, settings);
            });
          },

          setMicState: (micOn) => {
            set((draft) => {
              draft.vad.micOn = micOn;
            });
          },

          setAutoStopMic: (value) => {
            set((draft) => {
              draft.vad.autoStopMic = value;
            });
          },

          setAutoStartMicOn: (value) => {
            set((draft) => {
              draft.vad.autoStartMicOn = value;
            });
          },

          setAutoStartMicOnConvEnd: (value) => {
            set((draft) => {
              draft.vad.autoStartMicOnConvEnd = value;
            });
          },

          // =========================
          // 媒体管理Actions
          // =========================
          setCurrentModel: (model) => {
            set((draft) => {
              draft.media.currentModel = model;
            });
          },

          updateMediaState: (updates) => {
            set((draft) => {
              Object.assign(draft.media, updates);
            });
          },

          setBackgroundUrl: (url) => {
            set((draft) => {
              draft.media.backgroundUrl = url;
            });
          },

          setBackgroundFiles: (files) => {
            set((draft) => {
              draft.media.backgroundFiles = files as any[];
            });
          },

          setUseCameraBackground: (use) => {
            set((draft) => {
              draft.media.useCameraBackground = use;
            });
          },

          setShowAdvertisements: (show) => {
            set((draft) => {
              draft.media.showAdvertisements = show;
            });
          },

          setAdvertisements: (ads) => {
            set((draft) => {
              draft.media.advertisements = ads;
              draft.media.currentAdIndex = 0;
            });
          },

          // =========================
          // 洗衣店Actions
          // =========================
          setIsLaundryMode: (enabled) => {
            set((draft) => {
              draft.media.isLaundryMode = enabled;
            });
          },

          setCurrentVideo: (videoPath, title = '解説動画') => {
            set((draft) => {
              draft.media.currentVideo = videoPath;
              draft.media.videoTitle = title;
              draft.media.isVideoPlaying = Boolean(videoPath);
            });
          },

          setAvailableMachines: (machines) => {
            set((draft) => {
              draft.media.availableMachines = machines;
            });
          },

          // =========================
          // 聊天管理Actions
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

          setForceNewMessage: (value) => {
            set((draft) => {
              draft.chat.forceNewMessage = value;
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

          setSubtitleText: (text) => {
            set((draft) => {
              draft.chat.subtitleText = text;
            });
          },

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

          setShowSubtitle: (show) => {
            set((draft) => {
              draft.chat.showSubtitle = show;
            });
          },

          updateChatState: (updates) => {
            set((draft) => {
              Object.assign(draft.chat, updates);
            });
          },

          // =========================
          // 配置管理Actions
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
              Object.assign(draft.config.appConfig, config);
            });
          },

          setBackendSynthComplete: (complete) => {
            set((draft) => {
              draft.backendSynthComplete = complete;
            });
          },

          updateProactiveSettings: (s) => {
            set((draft) => {
              Object.assign(draft.proactive, s);
            });
          },

          // =========================
          // 工具方法
          // =========================
          resetAll: () => {
            set((draft) => {
              draft.ai = initialAiState;
              draft.vad = initialVADState;
              draft.media = initialMediaState;
              draft.chat = initialChatState;
              draft.config = initialConfigState;
              draft.backendSynthComplete = false;
            });
          },

          getSnapshot: () => {
            const state = get();
            return {
              ai: state.ai,
              vad: state.vad,
              media: state.media,
              chat: state.chat,
              config: state.config,
              backendSynthComplete: state.backendSynthComplete,
            };
          },
        }))
      ),
      {
        name: 'app-store',
        partialize: (state) => ({
          // 只持久化部分状态
          vad: {
            micOn: state.vad.micOn,
            autoStopMic: state.vad.autoStopMic,
            autoStartMicOn: state.vad.autoStartMicOn,
            autoStartMicOnConvEnd: state.vad.autoStartMicOnConvEnd,
            settings: state.vad.settings,
          },
          media: {
            backgroundUrl: state.media.backgroundUrl,
            showAdvertisements: state.media.showAdvertisements,
            isLaundryMode: state.media.isLaundryMode,
          },
          config: {
            wsUrl: state.config.wsUrl,
            baseUrl: state.config.baseUrl,
            appConfig: state.config.appConfig,
          },
        }),
        // ✅ 智能合并：HTTPS 环境下忽略 localStorage 中的本地地址
        merge: (persistedState: any, currentState: any) => {
          const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
          
          // 检测 localStorage 中是否有本地地址（127.0.0.1 或 localhost）
          const hasLocalAddress = persistedState?.config?.wsUrl && 
            /127\.0\.0\.1|localhost/i.test(persistedState.config.wsUrl);
          
          // HTTPS 环境下，如果 localStorage 存的是本地地址，忽略它
          if (isHttps && hasLocalAddress) {
            console.log('🔒 检测到 HTTPS 环境，忽略 localStorage 中的本地地址配置');
            return {
              ...currentState,
              ...persistedState,
              config: {
                ...persistedState.config,
                // 使用环境检测的值，而不是 localStorage 的本地地址
                wsUrl: currentState.config.wsUrl,
                baseUrl: currentState.config.baseUrl,
              },
            };
          }
          
          // 其他情况：正常合并
          return {
            ...currentState,
            ...persistedState,
          };
        },
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// =========================
// 选择器Hooks (性能优化)
// =========================

// AI状态选择器 (重命名避免与Context版本冲突)
export const useAiStatus = () => useAppStore((state) => state.ai.status);
export const useAiStore = () => {
  const status = useAppStore((s) => s.ai.status);
  const isIdle = useAppStore((s) => s.ai.isIdle);
  const isThinkingSpeaking = useAppStore((s) => s.ai.isThinkingSpeaking);
  const setAiState = useAppStore((s) => s.setAiState);
  return {
    status,
    isIdle,
    isThinkingSpeaking,
    setAiState,
  };
};

// VAD状态选择器 (重命名避免与Context版本冲突)
export const useVADStore = () => {
  const micOn = useAppStore((s) => s.vad.micOn);
  const autoStopMic = useAppStore((s) => s.vad.autoStopMic);
  const autoStartMicOn = useAppStore((s) => s.vad.autoStartMicOn);
  const autoStartMicOnConvEnd = useAppStore((s) => s.vad.autoStartMicOnConvEnd);
  const settings = useAppStore((s) => s.vad.settings);
  const setMicState = useAppStore((s) => s.setMicState);
  const updateVADSettings = useAppStore((s) => s.updateVADSettings);
  const setAutoStopMic = useAppStore((s) => s.setAutoStopMic);
  const setAutoStartMicOn = useAppStore((s) => s.setAutoStartMicOn);
  const setAutoStartMicOnConvEnd = useAppStore((s) => s.setAutoStartMicOnConvEnd);
  return { 
    micOn, 
    autoStopMic, 
    autoStartMicOn, 
    autoStartMicOnConvEnd, 
    settings, 
    setMicState, 
    updateVADSettings,
    setAutoStopMic,
    setAutoStartMicOn,
    setAutoStartMicOnConvEnd,
  };
};

// 媒体状态选择器 (重命名避免与Context版本冲突)
export const useMediaStore = () => {
  const currentModel = useAppStore((s) => s.media.currentModel);
  const backgroundUrl = useAppStore((s) => s.media.backgroundUrl);
  const backgroundFiles = useAppStore((s) => s.media.backgroundFiles);
  const useCameraBackground = useAppStore((s) => s.media.useCameraBackground);
  const showAdvertisements = useAppStore((s) => s.media.showAdvertisements);
  const advertisements = useAppStore((s) => s.media.advertisements);
  const isLaundryMode = useAppStore((s) => s.media.isLaundryMode);
  const currentVideo = useAppStore((s) => s.media.currentVideo);
  const videoTitle = useAppStore((s) => s.media.videoTitle);
  const isVideoPlaying = useAppStore((s) => s.media.isVideoPlaying);
  const availableMachines = useAppStore((s) => s.media.availableMachines);
  const setCurrentModel = useAppStore((s) => s.setCurrentModel);
  const updateMediaState = useAppStore((s) => s.updateMediaState);
  const setShowAdvertisements = useAppStore((s) => s.setShowAdvertisements);
  const setAdvertisements = useAppStore((s) => s.setAdvertisements);
  const setIsLaundryMode = useAppStore((s) => s.setIsLaundryMode);
  const setCurrentVideo = useAppStore((s) => s.setCurrentVideo);
  const setAvailableMachines = useAppStore((s) => s.setAvailableMachines);
  const setBackgroundFiles = useAppStore((s) => s.setBackgroundFiles);
  const setUseCameraBackground = useAppStore((s) => s.setUseCameraBackground);
  return {
    currentModel,
    backgroundUrl,
    backgroundFiles,
    useCameraBackground,
    showAdvertisements,
    advertisements,
    isLaundryMode,
    currentVideo,
    videoTitle,
    isVideoPlaying,
    availableMachines,
    setCurrentModel,
    updateMediaState,
    setShowAdvertisements,
    setAdvertisements,
    setIsLaundryMode,
    setCurrentVideo,
    setAvailableMachines,
    setBackgroundFiles,
    setUseCameraBackground,
  };
};

// 聊天状态选择器 (重命名避免与Context版本冲突)
export const useChatStore = () => {
  const messages = useAppStore((s) => s.chat.messages);
  const historyList = useAppStore((s) => s.chat.historyList);
  const currentHistoryUid = useAppStore((s) => s.chat.currentHistoryUid);
  const fullResponse = useAppStore((s) => s.chat.fullResponse);
  const forceNewMessage = useAppStore((s) => s.chat.forceNewMessage);
  const subtitleText = useAppStore((s) => s.chat.subtitleText);
  const showSubtitle = useAppStore((s) => s.chat.showSubtitle);
  const addMessage = useAppStore((s) => s.addMessage);
  const setMessages = useAppStore((s) => s.setMessages);
  const setHistoryList = useAppStore((s) => s.setHistoryList);
  const setCurrentHistoryUid = useAppStore((s) => s.setCurrentHistoryUid);
  const setForceNewMessage = useAppStore((s) => s.setForceNewMessage);
  const appendHumanMessage = useAppStore((s) => s.appendHumanMessage);
  const appendAIMessage = useAppStore((s) => s.appendAIMessage);
  const setSubtitleText = useAppStore((s) => s.setSubtitleText);
  const setFullResponse = useAppStore((s) => s.setFullResponse);
  const appendResponse = useAppStore((s) => s.appendResponse);
  const clearResponse = useAppStore((s) => s.clearResponse);
  const setShowSubtitle = useAppStore((s) => s.setShowSubtitle);
  return { messages, historyList, currentHistoryUid, fullResponse, forceNewMessage, subtitleText, showSubtitle, addMessage, setMessages, setHistoryList, setCurrentHistoryUid, setForceNewMessage, appendHumanMessage, appendAIMessage, setSubtitleText, setFullResponse, appendResponse, clearResponse, setShowSubtitle };
};

// 配置状态选择器 (重命名避免与Context版本冲突)
export const useConfigStore = () => {
  const wsUrl = useAppStore((s) => s.config.wsUrl);
  const baseUrl = useAppStore((s) => s.config.baseUrl);
  const wsState = useAppStore((s) => s.config.wsState);
  const modelInfo = useAppStore((s) => s.config.modelInfo);
  const updateNetworkConfig = useAppStore((s) => s.updateNetworkConfig);
  const setModelInfo = useAppStore((s) => s.setModelInfo);
  return { wsUrl, baseUrl, wsState, modelInfo, updateNetworkConfig, setModelInfo };
};

export const useProactiveStore = () => {
  const allowButtonTrigger = useAppStore((s) => s.proactive.allowButtonTrigger);
  const allowProactiveSpeak = useAppStore((s) => s.proactive.allowProactiveSpeak);
  const idleSecondsToSpeak = useAppStore((s) => s.proactive.idleSecondsToSpeak);
  const updateProactiveSettings = useAppStore((s) => s.updateProactiveSettings);
  return { allowButtonTrigger, allowProactiveSpeak, idleSecondsToSpeak, updateProactiveSettings };
};

// =========================
// 资源清理和错误处理集成
// =========================

// 订阅副作用会在部分环境下引发渲染链加深，先暂停全局订阅，改到局部实现

console.log('🏪 Zustand企业级状态管理系统已初始化');