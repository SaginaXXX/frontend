/* eslint-disable no-sparse-arrays */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line object-curly-newline
import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { wsService, MessageEvent } from '@/services/websocket-service';
import {
  WebSocketContext, HistoryInfo,
} from '@/context/websocket-context';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { useAudioTask } from '@/components/canvas/live2d';
// import { useBgUrl } from '@/context/bgurl-context';
import { useConfig } from '@/context/character-config-context';
import { useChatHistory } from '@/context/chat-history-context';
import { toaster } from '@/components/ui/toaster';
import { useVAD } from '@/context/vad-context';
import { useGroup } from '@/context/group-context';
import { useInterrupt } from '@/hooks/utils/use-interrupt';
import { useMediaStore, useChatStore, useAiStore, useAppStore, useConfigStore } from '@/store';

const WebSocketHandler = memo(({ children }: { children: React.ReactNode }) => {
  const [wsState, setWsState] = useState<string>('CLOSED');
  // ✅ 从 Zustand Store 读取配置（单一数据源）
  const { wsUrl, baseUrl, updateNetworkConfig } = useConfigStore();
  const baseUrlRef = useRef(baseUrl);
  const { status: aiStatus, setAiState } = useAiStore();
  const setBackendSynthComplete = useAppStore((s) => s.setBackendSynthComplete);
  const { setModelInfo } = useLive2DConfig();
  const { setSubtitleText } = useChatStore();
  const { clearResponse, setForceNewMessage } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const { confUid, setConfName, setConfUid, setConfigFiles } = useConfig();
  const [pendingModelInfo, setPendingModelInfo] = useState<ModelInfo | undefined>(undefined);
  const { setSelfUid, setGroupMembers, setIsOwner } = useGroup();
  const { startMic, stopMic, autoStartMicOnConvEnd } = useVAD();
  const autoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  const { interrupt } = useInterrupt();
  const { 
    setCurrentVideo,
    setAvailableMachines,
    isLaundryMode,
    setIsLaundryMode,
    isVideoPlaying,
    setShowAdvertisements,
    setBackgroundFiles,
  } = useMediaStore();

  const {
    setCurrentHistoryUid, setMessages, setHistoryList, appendHumanMessage,
  } = useChatHistory();

  // Refs to stabilize dependencies and avoid re-creating callbacks
  const aiStatusRef = useRef(aiStatus);
  const isVideoPlayingRef = useRef(isVideoPlaying);
  const isLaundryModeRef = useRef(isLaundryMode);
  const startMicRef = useRef(startMic);
  const stopMicRef = useRef(stopMic);
  const setAiStateRef = useRef(setAiState);
  const setSubtitleTextRef = useRef(setSubtitleText);
  const setConfigFilesRef = useRef(setConfigFiles);
  const setSelfUidRef = useRef(setSelfUid);
  const setGroupMembersRef = useRef(setGroupMembers);
  const setIsOwnerRef = useRef(setIsOwner);
  const addAudioTaskRef = useRef(addAudioTask);
  const setBackendSynthCompleteRef = useRef(setBackendSynthComplete);
  const clearResponseRef = useRef(clearResponse);
  const setCurrentHistoryUidRef = useRef(setCurrentHistoryUid);
  const setMessagesRef = useRef(setMessages);
  const setHistoryListRef = useRef(setHistoryList);
  const appendHumanMessageRef = useRef(appendHumanMessage);
  const setCurrentVideoRef = useRef(setCurrentVideo);
  const setAvailableMachinesRef = useRef(setAvailableMachines);
  const setShowAdvertisementsRef = useRef(setShowAdvertisements);
  const setBackgroundFilesRef = useRef(setBackgroundFiles);

  useEffect(() => { aiStatusRef.current = aiStatus; }, [aiStatus]);
  useEffect(() => { isVideoPlayingRef.current = isVideoPlaying; }, [isVideoPlaying]);
  useEffect(() => { isLaundryModeRef.current = isLaundryMode; }, [isLaundryMode]);
  useEffect(() => { startMicRef.current = startMic; }, [startMic]);
  useEffect(() => { stopMicRef.current = stopMic; }, [stopMic]);
  useEffect(() => { setAiStateRef.current = setAiState; }, [setAiState]);
  useEffect(() => { setSubtitleTextRef.current = setSubtitleText; }, [setSubtitleText]);
  useEffect(() => { setConfigFilesRef.current = setConfigFiles; }, [setConfigFiles]);
  useEffect(() => { setSelfUidRef.current = setSelfUid; }, [setSelfUid]);
  useEffect(() => { setGroupMembersRef.current = setGroupMembers; }, [setGroupMembers]);
  useEffect(() => { setIsOwnerRef.current = setIsOwner; }, [setIsOwner]);
  useEffect(() => { addAudioTaskRef.current = addAudioTask; }, [addAudioTask]);
  useEffect(() => { setBackendSynthCompleteRef.current = setBackendSynthComplete; }, [setBackendSynthComplete]);
  useEffect(() => { clearResponseRef.current = clearResponse; }, [clearResponse]);
  useEffect(() => { setCurrentHistoryUidRef.current = setCurrentHistoryUid; }, [setCurrentHistoryUid]);
  useEffect(() => { setMessagesRef.current = setMessages; }, [setMessages]);
  useEffect(() => { setHistoryListRef.current = setHistoryList; }, [setHistoryList]);
  useEffect(() => { appendHumanMessageRef.current = appendHumanMessage; }, [appendHumanMessage]);
  useEffect(() => { setCurrentVideoRef.current = setCurrentVideo; }, [setCurrentVideo]);
  useEffect(() => { setAvailableMachinesRef.current = setAvailableMachines; }, [setAvailableMachines]);
  useEffect(() => { setShowAdvertisementsRef.current = setShowAdvertisements; }, [setShowAdvertisements]);
  useEffect(() => { setBackgroundFilesRef.current = setBackgroundFiles; }, [setBackgroundFiles]);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, [autoStartMicOnConvEnd]);

  useEffect(() => { baseUrlRef.current = baseUrl; }, [baseUrl]);

  useEffect(() => {
    if (pendingModelInfo) {
      setModelInfo(pendingModelInfo);
      setPendingModelInfo(undefined);
    }
  }, [pendingModelInfo, setModelInfo, confUid]);

  

  const handleControlMessage = useCallback((controlText: string) => {
    switch (controlText) {
      case 'start-mic':
        console.log('Starting microphone...');
        startMicRef.current();
        break;
      case 'stop-mic':
        console.log('Stopping microphone...');
        stopMicRef.current();
        break;
      case 'conversation-chain-start':
        setAiStateRef.current('thinking');
        setSubtitleTextRef.current('考え中...');
        audioTaskQueue.clearQueue();
        clearResponseRef.current();
        break;
      case 'conversation-chain-end':
        audioTaskQueue.addTask(() => new Promise<void>((resolve) => {
          setAiStateRef.current((currentState) => {
            if (currentState === 'thinking') {
              // Auto start mic if enabled
              if (autoStartMicOnConvEndRef.current) {
                startMicRef.current();
              }
              return 'idle';
            }
            return currentState;
          });
          resolve();
        }));
        break;
      default:
        console.warn('Unknown control command:', controlText);
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: MessageEvent) => {
    console.log('Received message from server:', message);
    switch (message.type) {
      case 'control':
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case 'set-model-and-conf':
        setAiStateRef.current('loading');
        if (message.conf_name) {
          setConfName(message.conf_name);
        }
        if (message.conf_uid) {
          setConfUid(message.conf_uid);
          console.log('confUid', message.conf_uid);
        }
        if (message.client_uid) {
          setSelfUidRef.current(message.client_uid);
        }
        // Normalize model URL before applying to state
        if (message.model_info && !message.model_info.url.startsWith("http")) {
          const modelUrl = baseUrlRef.current + message.model_info.url;
          // eslint-disable-next-line no-param-reassign
          message.model_info.url = modelUrl;
        }
        // Apply pending model after url normalization
        if (message.model_info) {
          console.log('Applying Live2D model:', message.model_info);
          setPendingModelInfo(message.model_info);
          toaster.create({ title: 'Loading model...', type: 'info', duration: 1200 });
        }

        setAiStateRef.current('idle');
        break;
      case 'full-text':
        if (message.text) {
          setSubtitleTextRef.current(message.text);
          // 当连接建立后，确保默认显示广告（避免旧持久化状态影响）
          if (message.text === 'Connection established') {
            // 仅在未播放教学视频时恢复广告
            if (!isVideoPlayingRef.current) {
              setShowAdvertisementsRef.current(true);
            }
          }
        }
        break;
      case 'config-files':
        if (message.configs) {
          setConfigFilesRef.current(message.configs);
        }
        break;
      case 'config-switched':
        setAiStateRef.current('idle');
        setSubtitleTextRef.current('新しいキャラクターが読み込まれました');

        toaster.create({
          title: message.conf_name ? `Character switched: ${message.conf_name}` : 'Character switched',
          type: 'success',
          duration: 2000,
        });

        // setModelInfo(undefined);

        wsService.sendMessage({ type: 'fetch-history-list' });
        wsService.sendMessage({ type: 'create-new-history' });
        break;
      case 'background-files':
        if (message.files && setBackgroundFilesRef.current) {
          setBackgroundFilesRef.current(message.files);
        }
        break;
      case 'laundry-video-response':
        // 处理洗衣店视频播放请求
        if (message.video_path) {
          // 自动启用洗衣店模式
          if (!isLaundryMode) {
            setIsLaundryMode(true);
          }
          // 隐藏广告，专注教程视频
          setShowAdvertisementsRef.current(false);
          const videoTitle = message.machine_id ? 
            `${message.machine_id}号洗濯機の使用説明` : 
            '洗衣机使用教程';
          
          // 构造完整的视频URL
          // 如果是相对路径，则使用baseUrl构造完整URL
          let videoUrl = message.video_path;
          if (videoUrl.startsWith('/')) {
            videoUrl = baseUrlRef.current + videoUrl;
          }
          
          console.log(`🎬 洗衣机视频URL: ${videoUrl}`);
          
          // 当开始播放视频时，清空当前TTS队列，避免重叠
          audioTaskQueue.clearQueue();
          setCurrentVideoRef.current(videoUrl, videoTitle);
        }
        break;
      case 'laundry-machines-list':
        // 更新可用洗衣机列表
        if (isLaundryMode && message.machines) {
          setAvailableMachinesRef.current(message.machines);
        }
        break;
      case 'wake-word-state':
        // 处理唤醒词状态更新
        const { action, matched_word, language, advertisement_control } = message;
        
        if (action === 'wake_up') {
          console.log(`✨ ウェイクワード検出: "${matched_word}" (${language}) - 会話開始`);
          // 可选：显示UI提示或更新状态指示器
        } else if (action === 'sleep') {
          console.log(`💤 終了ワード検出: "${matched_word}" (${language}) - 会話終了`);
        } else if (action === 'ignored') {
          console.log(`🔇 非アクティブ状態、入力無視: "${matched_word}"`);
        }
        
        // 🎬 处理广告轮播控制
        if (advertisement_control) {
          const { should_show_ads, control_action, trigger_reason } = advertisement_control;
          
          if (control_action === 'start_ads') {
            console.log(`🎬 広告システム: 広告カルーセル再生開始 (理由: ${trigger_reason})`);
            setShowAdvertisementsRef.current(true);
            
            // ✅ 移除重新显示时的刷新事件，避免播放中断
            // 广告轮播会在初始化时自动加载，不需要在这里强制刷新
            console.log('✅ 广告重新显示，无需刷新避免播放中断');
          } else if (control_action === 'stop_ads') {
            console.log(`🛑 広告システム: 広告再生停止 (理由: ${trigger_reason})`);
            setShowAdvertisementsRef.current(false);
          }
          
          console.log(`📊 広告表示状態: ${should_show_ads ? '表示' : '非表示'}`);
        }
        
        // 可以在这里添加更多的UI状态更新
        // 例如：setWakeWordState(current_state);
        break;
      case 'audio':
        // 正在播放教学视频时，抑制TTS以避免与视频声音重叠
        if (aiStatusRef.current === 'interrupted' || aiStatusRef.current === 'listening' || isVideoPlayingRef.current) {
          console.log('Audio playback intercepted. Sentence:', message.display_text?.text);
        } else {
          console.log("actions", message.actions);
          addAudioTaskRef.current({
            audioBase64: message.audio || '',
            volumes: message.volumes || [],
            sliceLength: message.slice_length || 0,
            displayText: message.display_text || null,
            expressions: message.actions?.expressions || null,
            forwarded: message.forwarded || false,
          });
        }
        break;
      case 'history-data':
        if (message.messages) {
          setMessagesRef.current(message.messages);
        }
        toaster.create({
          title: 'History loaded',
          type: 'success',
          duration: 2000,
        });
        break;
      case 'new-history-created':
        setAiStateRef.current('idle');
        setSubtitleTextRef.current('新しい会話が始まりました');
        // No need to open mic here
        if (message.history_uid) {
          setCurrentHistoryUidRef.current(message.history_uid);
          setMessagesRef.current([]);
          const newHistory: HistoryInfo = {
            uid: message.history_uid,
            latest_message: null,
            timestamp: new Date().toISOString(),
          };
          setHistoryListRef.current((prev: HistoryInfo[]) => [newHistory, ...prev]);
          toaster.create({
            title: 'New chat history created',
            type: 'success',
            duration: 2000,
          });
        }
        break;
      case 'history-deleted':
        toaster.create({
          title: message.success
            ? 'History deleted successfully'
            : 'Failed to delete history',
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'history-list':
        if (message.histories) {
          setHistoryListRef.current(message.histories);
          if (message.histories.length > 0) {
            setCurrentHistoryUidRef.current(message.histories[0].uid);
          }
        }
        break;
      case 'user-input-transcription':
        console.log('user-input-transcription: ', message.text);
        if (message.text) {
          appendHumanMessageRef.current(message.text);
        }
        break;
      case 'error':
        toaster.create({
          title: message.message,
          type: 'error',
          duration: 2000,
        });
        break;
      case 'group-update':
        console.log('Received group-update:', message.members);
        if (message.members) {
          setGroupMembersRef.current(message.members);
        }
        if (message.is_owner !== undefined) {
          setIsOwnerRef.current(message.is_owner);
        }
        break;
      case 'group-operation-result':
        toaster.create({
          title: message.message,
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'backend-synth-complete':
        setBackendSynthCompleteRef.current(true);
        break;
      case 'conversation-chain-end':
        if (!audioTaskQueue.hasTask()) {
          setAiStateRef.current((currentState) => {
            if (currentState === 'thinking') {
              return 'idle';
            }
            return currentState;
          });
        }
        break;
      case 'force-new-message':
        setForceNewMessage(true);
        break;
      case 'interrupt-signal':
        // Handle forwarded interrupt
        interrupt(false); // do not send interrupt signal to server
        break;
      case 'mcp-tool-response':
        // MCP工具响应已由组件直接处理，这里只做日志记录
        console.log('📡 MCP工具响应已转发给相关组件:', message.tool_name);
        break;
      case 'adaptive-vad-response':
        // 自适应VAD控制响应
        if (message.success) {
          console.log(`✅ VAD控制操作 '${message.action}' 成功执行`);
        } else {
          console.warn(`❌ VAD控制操作失败: ${message.error}`);
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  // 分离连接管理和订阅管理，确保正确清理
  useEffect(() => {
    console.log('🔌 WebSocketHandler: 初始化WebSocket连接', wsUrl);
    wsService.connect(wsUrl);
    
    return () => {
      console.log('🔌 WebSocketHandler: 组件卸载，断开WebSocket连接');
      // 组件卸载时主动断开连接，避免悬挂的WebSocket
      wsService.disconnect();
    };
  }, [wsUrl]);

  useEffect(() => {
    console.log('📡 WebSocketHandler: 设置订阅监听器');
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);
    
    // 开发环境下监控订阅数量
    const monitorInterval = process.env.NODE_ENV === 'development' 
      ? setInterval(() => {
          const counts = wsService.getSubscriptionCount();
          console.debug('📊 订阅监控:', counts);
          if (counts.message > 2 || counts.state > 2) {
            console.warn('⚠️  检测到订阅泄漏！订阅数量异常:', counts);
          }
        }, 30000) // 每30秒检查一次
      : null;
    
    // ✅ 统一的清理函数，避免条件分支
    return () => {
      // 清理监控定时器
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
      
      console.log('📡 WebSocketHandler: 清理订阅监听器');
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      
      // 开发环境下检查最终订阅数量
      if (process.env.NODE_ENV === 'development') {
        const finalCounts = wsService.getSubscriptionCount();
        console.log('📊 清理后订阅数量:', finalCounts);
      }
    };
  }, [handleWebSocketMessage]); // 移除 wsUrl 依赖，避免 URL 变化时重复订阅

  // ✅ Context value - 使用 Store 的 updateNetworkConfig 更新配置
  const webSocketContextValue = useMemo(() => ({
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState,
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl: (url: string) => {
      updateNetworkConfig({ wsUrl: url });
      wsService.connect(url);
    },
    baseUrl,
    setBaseUrl: (url: string) => {
      updateNetworkConfig({ baseUrl: url });
    },
  }), [wsState, wsUrl, baseUrl, updateNetworkConfig]);

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
});

export default WebSocketHandler;
