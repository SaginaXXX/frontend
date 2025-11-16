/**
 * Zustand Store 类型定义
 * 集中管理所有状态类型
 */

// =========================
// 基础状态类型
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
  micOn: boolean;
  autoStopMic: boolean;
  autoStartMicOn: boolean;
  autoStartMicOnConvEnd: boolean;
  previousTriggeredProbability: number;
  settings: {
    positiveSpeechThreshold: number;
    negativeSpeechThreshold: number;
    redemptionFrames: number;
    frameSamples: number;
    minSpeechFrames: number;
    vadMode: number;
  };
}

// 广告音频模式枚举
export enum AdAudioMode {
  MUTED = 'muted',           // 🔇 静音模式
  AUDIO = 'audio',           // 🎵 音声模式  
  AUDIO_VAD = 'audio_vad'    // 🎵 音声+VADモード
}

// 广告音频设置接口
export interface AdvertisementAudioSettings {
  audioMode: AdAudioMode;
  autoSwitchNext: boolean;
  cleanPlaybackExperience: boolean;
  supportAnyLength: boolean;
}

// Live2D 模型配置接口
export interface ModelInfo {
  name?: string;
  description?: string;
  url: string;
  kScale: number;
  initialXshift: number;
  initialYshift: number;
  idleMotionGroupName?: string;
  defaultEmotion?: number | string;
  emotionMap: { [key: string]: number | string };
  pointerInteractive?: boolean;
  tapMotions?: { [key: string]: { [key: string]: number } };
  scrollToResize?: boolean;
}

export interface MediaState {
  // Live2D配置
  live2d: {
    modelInfo: ModelInfo | undefined;
    isLoading: boolean;
    scaleMemory: Record<string, number>;
    positionMemory: Record<string, { x: number; y: number }>;
  };
  
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
  
  // 广告音频设置
  advertisementAudio: AdvertisementAudioSettings;
}

// 角色配置文件接口
export interface ConfigFile {
  filename: string;
  name: string;
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

// 配置状态
export interface ConfigurationState {
  // 模型配置
  modelInfo: any | null;
  
  // 角色配置
  character: {
    confName: string;
    confUid: string;
    configFiles: ConfigFile[];
  };
  
  // 网络配置
  wsUrl: string;
  baseUrl: string;
  wsState: string;
  
  // 应用配置
  appConfig: any;
}

// 主动说话状态
export interface ProactiveSpeakState {
  allowButtonTrigger: boolean;
  allowProactiveSpeak: boolean;
  idleSecondsToSpeak: number;
}

// =========================
// MCP Canvas 状态类型
// =========================

// 地图标记点
export interface MapMarker {
  latitude: number;
  longitude: number;
  label?: string;
  icon?: string;
  popup?: string;
}

// 地图数据
export interface MapData {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
}

// MCP 内容数据
export interface MCPContentData {
  // 通用字段
  url?: string;
  title?: string;
  description?: string;
  
  // 图片特定字段
  alt?: string;
  width?: number;
  height?: number;
  
  // 视频特定字段
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  duration?: number;
  
  // 地图特定字段
  mapData?: MapData;
}

// MCP 内容类型
export type MCPContentType = 'image' | 'video' | 'map' | null;

// MCP 状态
export interface MCPState {
  // 画布显示状态
  isVisible: boolean;
  
  // 内容类型和数据
  contentType: MCPContentType;
  contentData: MCPContentData | null;
  
  // 画布位置和尺寸（相对于 Live2D 容器）
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  
  // 视频播放状态
  isVideoPlaying: boolean;
}

