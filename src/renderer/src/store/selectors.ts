/**
 * Store Selectors
 * 集中管理所有状态选择器 hooks，优化性能
 */

import { useAppStore } from './index';
import type { ConfigFile } from './types';

// ✅ 稳定的默认值引用（避免内联字面量导致引用不稳定）
const EMPTY_CONFIG_FILES: ConfigFile[] = [];
const EMPTY_CHARACTER = { confName: '', confUid: '', configFiles: EMPTY_CONFIG_FILES };

// =========================
// AI 状态选择器
// =========================

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

// =========================
// VAD 状态选择器
// =========================

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

// =========================
// 媒体状态选择器
// =========================

export const useMediaStore = () => {
  // Live2D 状态
  const live2d = useAppStore((s) => s.media.live2d);
  const setLive2DModelInfo = useAppStore((s) => s.setLive2DModelInfo);
  const updateLive2DScale = useAppStore((s) => s.updateLive2DScale);
  const setLive2DLoading = useAppStore((s) => s.setLive2DLoading);
  
  // 背景相关
  const backgroundUrl = useAppStore((s) => s.media.backgroundUrl);
  const backgroundFiles = useAppStore((s) => s.media.backgroundFiles);
  const useCameraBackground = useAppStore((s) => s.media.useCameraBackground);
  const setBackgroundFiles = useAppStore((s) => s.setBackgroundFiles);
  const setUseCameraBackground = useAppStore((s) => s.setUseCameraBackground);
  
  // 广告相关
  const showAdvertisements = useAppStore((s) => s.media.showAdvertisements);
  const advertisements = useAppStore((s) => s.media.advertisements);
  const setShowAdvertisements = useAppStore((s) => s.setShowAdvertisements);
  const setAdvertisements = useAppStore((s) => s.setAdvertisements);
  
  // 广告音频设置
  const advertisementAudio = useAppStore((s) => s.media.advertisementAudio);
  const setAdvertisementAudioMode = useAppStore((s) => s.setAdvertisementAudioMode);
  const updateAdvertisementAudioSettings = useAppStore((s) => s.updateAdvertisementAudioSettings);
  
  // 通用
  const updateMediaState = useAppStore((s) => s.updateMediaState);
  
  return {
    // Live2D
    live2d,
    setLive2DModelInfo,
    updateLive2DScale,
    setLive2DLoading,
    // 背景
    backgroundUrl,
    backgroundFiles,
    useCameraBackground,
    setBackgroundFiles,
    setUseCameraBackground,
    // 广告
    showAdvertisements,
    advertisements,
    setShowAdvertisements,
    setAdvertisements,
    // 广告音频
    advertisementAudio,
    setAdvertisementAudioMode,
    updateAdvertisementAudioSettings,
    // 通用
    updateMediaState,
  };
};

// =========================
// 聊天状态选择器
// =========================

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
  
  return { 
    messages, 
    historyList, 
    currentHistoryUid, 
    fullResponse, 
    forceNewMessage, 
    subtitleText, 
    showSubtitle, 
    addMessage, 
    setMessages, 
    setHistoryList, 
    setCurrentHistoryUid, 
    setForceNewMessage, 
    appendHumanMessage, 
    appendAIMessage, 
    setSubtitleText, 
    setFullResponse, 
    appendResponse, 
    clearResponse, 
    setShowSubtitle 
  };
};

// =========================
// 配置状态选择器
// =========================

export const useConfigStore = () => {
  const wsUrl = useAppStore((s) => s.config?.wsUrl ?? 'ws://127.0.0.1:12393/client-ws');
  const baseUrl = useAppStore((s) => s.config?.baseUrl ?? 'http://127.0.0.1:12393');
  const wsState = useAppStore((s) => s.config?.wsState ?? 'CLOSED');
  const modelInfo = useAppStore((s) => s.config?.modelInfo ?? null);
  const updateNetworkConfig = useAppStore((s) => s.updateNetworkConfig);
  const setModelInfo = useAppStore((s) => s.setModelInfo);
  return { wsUrl, baseUrl, wsState, modelInfo, updateNetworkConfig, setModelInfo };
};

// =========================
// ProactiveSpeak 状态选择器
// =========================

export const useProactiveStore = () => {
  const allowButtonTrigger = useAppStore((s) => s.proactive?.allowButtonTrigger ?? false);
  const allowProactiveSpeak = useAppStore((s) => s.proactive?.allowProactiveSpeak ?? false);
  const idleSecondsToSpeak = useAppStore((s) => s.proactive?.idleSecondsToSpeak ?? 5);
  const updateProactiveSettings = useAppStore((s) => s.updateProactiveSettings);
  return { allowButtonTrigger, allowProactiveSpeak, idleSecondsToSpeak, updateProactiveSettings };
};

// =========================
// 角色配置选择器
// =========================

export const useCharacterStore = () => {
  const character = useAppStore((s) => s.config?.character ?? EMPTY_CHARACTER);
  const confName = useAppStore((s) => s.config?.character?.confName ?? '');
  const confUid = useAppStore((s) => s.config?.character?.confUid ?? '');
  const configFiles = useAppStore((s) => s.config?.character?.configFiles ?? EMPTY_CONFIG_FILES);
  const setCharacterConfName = useAppStore((s) => s.setCharacterConfName);
  const setCharacterConfUid = useAppStore((s) => s.setCharacterConfUid);
  const setCharacterConfigFiles = useAppStore((s) => s.setCharacterConfigFiles);
  const updateCharacterConfig = useAppStore((s) => s.updateCharacterConfig);
  return {
    character,
    confName,
    confUid,
    configFiles,
    setConfName: setCharacterConfName,
    setConfUid: setCharacterConfUid,
    setConfigFiles: setCharacterConfigFiles,
    updateCharacterConfig,
  };
};

// =========================
// MCP Canvas 选择器
// =========================

export const useMCPStore = () => {
  const mcp = useAppStore((s) => s.mcp);
  const showMCPContent = useAppStore((s) => s.showMCPContent);
  const hideMCPContent = useAppStore((s) => s.hideMCPContent);
  const updateMCPPosition = useAppStore((s) => s.updateMCPPosition);
  const updateMCPSize = useAppStore((s) => s.updateMCPSize);
  const setMCPVideoPlaying = useAppStore((s) => s.setMCPVideoPlaying);
  return {
    mcp,
    showMCPContent,
    hideMCPContent,
    updateMCPPosition,
    updateMCPSize,
    setMCPVideoPlaying,
  };
};

// 精确订阅单个 MCP 字段
export const useMCPVisible = () => useAppStore((s) => s.mcp?.isVisible ?? false);
export const useMCPContentType = () => useAppStore((s) => s.mcp?.contentType ?? null);
export const useMCPContentData = () => useAppStore((s) => s.mcp?.contentData ?? null);
export const useMCPPosition = () => useAppStore((s) => s.mcp?.position ?? { x: 0, y: 0 });
export const useMCPSize = () => useAppStore((s) => s.mcp?.size ?? { width: 400, height: 300 });
export const useMCPVideoPlaying = () => useAppStore((s) => s.mcp?.isVideoPlaying ?? false);

