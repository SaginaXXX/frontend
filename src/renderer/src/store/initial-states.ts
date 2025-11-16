/**
 * 初始状态定义
 * 集中管理所有 slice 的初始状态
 */

import { 
  AiState, 
  VADState, 
  MediaState, 
  ChatState, 
  ConfigurationState, 
  ProactiveSpeakState,
  MCPState,
  AdAudioMode 
} from './types';
import { getInitialServerConfig } from './config';

const initialServerConfig = getInitialServerConfig();

export const initialAiState: AiState = {
  status: 'idle',
  isIdle: true,
  isThinkingSpeaking: false,
  isInterrupted: false,
  isLoading: false,
  isListening: false,
  isWaiting: false,
};

export const initialVADState: VADState = {
  micOn: false,
  autoStopMic: true,
  autoStartMicOn: false,
  autoStartMicOnConvEnd: true,
  previousTriggeredProbability: 0,
  settings: {
    positiveSpeechThreshold: 15,
    negativeSpeechThreshold: 18,
    redemptionFrames: 17,
    frameSamples: 1536,
    minSpeechFrames: 4,
    vadMode: 3,
  },
};

export const initialMediaState: MediaState = {
  // Live2D配置
  live2d: {
    modelInfo: undefined,
    isLoading: false,
    scaleMemory: {},
    positionMemory: {},
  },
  // 背景相关
  backgroundUrl: '',
  backgroundFiles: [],
  useCameraBackground: false,
  // 摄像头相关
  stream: null,
  isStreaming: false,
  // 广告相关
  showAdvertisements: true,
  currentAdIndex: 0,
  advertisements: [],
  isAdPlaying: false,
  // 广告音频设置
  advertisementAudio: {
    audioMode: AdAudioMode.AUDIO_VAD,
    autoSwitchNext: true,
    cleanPlaybackExperience: true,
    supportAnyLength: true,
  },
};

export const initialChatState: ChatState = {
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

export const initialConfigState: ConfigurationState = {
  modelInfo: null,
  character: {
    confName: '',
    confUid: '',
    configFiles: [],
  },
  wsUrl: initialServerConfig.wsUrl,
  baseUrl: initialServerConfig.baseUrl,
  wsState: 'CLOSED',
  appConfig: {},
};

export const initialProactiveState: ProactiveSpeakState = {
  allowButtonTrigger: false,
  allowProactiveSpeak: false,
  idleSecondsToSpeak: 5,
};

export const initialMCPState: MCPState = {
  isVisible: false,
  contentType: null,
  contentData: null,
  position: {
    x: 0,  // 将由 use-mcp-position 计算
    y: 0,
  },
  size: {
    width: 400,  // 默认宽度
    height: 300, // 默认高度
  },
  isVideoPlaying: false,
};

