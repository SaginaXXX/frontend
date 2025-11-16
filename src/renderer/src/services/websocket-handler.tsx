/* eslint-disable no-sparse-arrays */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line object-curly-newline
import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { wsService, MessageEvent } from "@/services/websocket-service";
import { WebSocketContext, HistoryInfo } from "@/context/websocket-context";
import { type ModelInfo } from "@/store";
import { audioTaskQueue } from "@/utils/task-queue";
import { useAudioTask } from "@/components/canvas/live2d";
// import { useBgUrl } from '@/context/bgurl-context';
import { useConfig } from "@/context/character-config-context";
import { useChatHistory } from "@/context/chat-history-context";
import { toaster } from "@/components/ui/toaster";
import { useVAD } from "@/context/vad-context";
import { useGroup } from "@/context/group-context";
import { useInterrupt } from "@/hooks/utils/use-interrupt";
import {
  useChatStore,
  useAiStore,
  useAppStore,
  useConfigStore,
  AdAudioMode,
} from "@/store";

const WebSocketHandler = memo(({ children }: { children: React.ReactNode }) => {
  const [wsState, setWsState] = useState<string>("CLOSED");
  const [isPet, setIsPet] = useState(false);
  // ✅ 从 Zustand Store 读取配置（单一数据源）
  const { wsUrl, baseUrl, updateNetworkConfig } = useConfigStore();
  const baseUrlRef = useRef(baseUrl);
  
  // 🔬 性能监控
  const performanceMetrics = useRef({
    messageCount: 0,
    totalProcessingTime: 0,
    slowMessages: [] as Array<{ type: string; time: number }>,
    messageReceiveTime: new Map<string, number>(),  // 记录消息接收时间
  });
  
  useEffect(() => {
    const unsubscribe = (window.api as any)?.onModeChanged((mode: string) => {
      setIsPet(mode === "pet");
    });
    return () => unsubscribe?.();
  }, []);
  const { status: aiStatus, setAiState } = useAiStore();
  const setBackendSynthComplete = useAppStore((s) => s.setBackendSynthComplete);
  // ✅ 直接从 useAppStore 获取 actions，避免订阅不需要的状态
  const setLive2DModelInfo = useAppStore((s) => s.setLive2DModelInfo);
  const setShowAdvertisements = useAppStore((s) => s.setShowAdvertisements);
  const setBackgroundFiles = useAppStore((s) => s.setBackgroundFiles);
  const showMCPContent = useAppStore((s) => s.showMCPContent);
  const hideMCPContent = useAppStore((s) => s.hideMCPContent);
  // ASR和VAD设置更新
  const setAutoStopMic = useAppStore((s) => s.setAutoStopMic);
  const setAutoStartMicOn = useAppStore((s) => s.setAutoStartMicOn);
  const setAutoStartMicOnConvEnd = useAppStore((s) => s.setAutoStartMicOnConvEnd);
  const updateVADSettings = useAppStore((s) => s.updateVADSettings);
  // 广告音频模式设置
  const setAdvertisementAudioMode = useAppStore((s) => s.setAdvertisementAudioMode);
  const { setSubtitleText } = useChatStore();
  const { clearResponse, setForceNewMessage } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const { setConfName, setConfUid, setConfigFiles } = useConfig();
  // ✅ 修复竞态条件：将 confUid 和 modelInfo 组合成一个状态
  const [pendingData, setPendingData] = useState<{
    confUid?: string;
    modelInfo?: ModelInfo;
  }>({});
  const { setSelfUid, setGroupMembers, setIsOwner } = useGroup();
  const { startMic, stopMic, autoStartMicOnConvEnd } = useVAD();
  const autoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  const { interrupt } = useInterrupt();

  const {
    setCurrentHistoryUid,
    setMessages,
    setHistoryList,
    appendHumanMessage,
  } = useChatHistory();

  // Refs to stabilize dependencies and avoid re-creating callbacks
  const aiStatusRef = useRef(aiStatus);
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
  const setShowAdvertisementsRef = useRef(setShowAdvertisements);
  const setBackgroundFilesRef = useRef(setBackgroundFiles);

  useEffect(() => {
    aiStatusRef.current = aiStatus;
  }, [aiStatus]);
  useEffect(() => {
    startMicRef.current = startMic;
  }, [startMic]);
  useEffect(() => {
    stopMicRef.current = stopMic;
  }, [stopMic]);
  useEffect(() => {
    setAiStateRef.current = setAiState;
  }, [setAiState]);
  useEffect(() => {
    setSubtitleTextRef.current = setSubtitleText;
  }, [setSubtitleText]);
  useEffect(() => {
    setConfigFilesRef.current = setConfigFiles;
  }, [setConfigFiles]);
  useEffect(() => {
    setSelfUidRef.current = setSelfUid;
  }, [setSelfUid]);
  useEffect(() => {
    setGroupMembersRef.current = setGroupMembers;
  }, [setGroupMembers]);
  useEffect(() => {
    setIsOwnerRef.current = setIsOwner;
  }, [setIsOwner]);
  useEffect(() => {
    addAudioTaskRef.current = addAudioTask;
  }, [addAudioTask]);
  useEffect(() => {
    setBackendSynthCompleteRef.current = setBackendSynthComplete;
  }, [setBackendSynthComplete]);
  useEffect(() => {
    clearResponseRef.current = clearResponse;
  }, [clearResponse]);
  useEffect(() => {
    setCurrentHistoryUidRef.current = setCurrentHistoryUid;
  }, [setCurrentHistoryUid]);
  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);
  useEffect(() => {
    setHistoryListRef.current = setHistoryList;
  }, [setHistoryList]);
  useEffect(() => {
    appendHumanMessageRef.current = appendHumanMessage;
  }, [appendHumanMessage]);
  useEffect(() => {
    setShowAdvertisementsRef.current = setShowAdvertisements;
  }, [setShowAdvertisements]);
  useEffect(() => {
    setBackgroundFilesRef.current = setBackgroundFiles;
  }, [setBackgroundFiles]);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, [autoStartMicOnConvEnd]);

  useEffect(() => {
    baseUrlRef.current = baseUrl;
  }, [baseUrl]);

  // ✅ 修复竞态条件：确保 confUid 先设置，再设置 modelInfo
  useEffect(() => {
    if (pendingData.confUid || pendingData.modelInfo) {
      // 1. 先设置 confUid（如果有）
      if (pendingData.confUid) {
        console.log("🔧 Setting confUid:", pendingData.confUid);
        setConfUid(pendingData.confUid);
      }

      // 2. 再设置 modelInfo，直接传入 confUid（避免依赖状态更新）
      if (pendingData.confUid && pendingData.modelInfo) {
        console.log("🎨 Setting modelInfo with confUid:", pendingData.confUid);
        // ✅ 传入 confUid 和 isPet 作为参数，避免依赖 React 状态更新
        setLive2DModelInfo(pendingData.modelInfo, pendingData.confUid, isPet);
      }

      // 3. 清空 pending 状态
      setPendingData({});
    }
  }, [pendingData, setLive2DModelInfo, setConfUid, isPet]);

  const handleControlMessage = useCallback((controlText: string) => {
    switch (controlText) {
      case "start-mic":
        console.log("Starting microphone...");
        startMicRef.current();
        break;
      case "stop-mic":
        console.log("Stopping microphone...");
        stopMicRef.current();
        break;
      case "conversation-chain-start":
        setAiStateRef.current("thinking");
        setSubtitleTextRef.current("考え中...");
        audioTaskQueue.clearQueue();
        clearResponseRef.current();
        
        // ✅ 图片画布：在AI开启下一句话后自动关闭
        // 视频画布：保持显示（会在播放结束后自动关闭）
        const currentMCPState = useAppStore.getState().mcp;
        if (currentMCPState?.isVisible && currentMCPState?.contentType === 'image') {
          console.log("🖼️ 对话开始：自动关闭图片画布");
          hideMCPContent();
        }
        // 视频画布不关闭，让它继续播放直到结束
        break;
      case "conversation-chain-end":
        audioTaskQueue.addTask(
          () =>
            new Promise<void>((resolve) => {
              // ✅ 修复：不依赖 AI 状态，直接在音频播放完成后启动麦克风
              setAiStateRef.current((currentState) => {
                // 设置状态为 idle
                if (
                  currentState === "thinking" ||
                  currentState === "speaking"
                ) {
                  return "idle";
                }
                return currentState;
              });

              // ✅ 修复：无论 AI 状态如何，只要开启了自动启动，就执行
              console.log("🔍 检查 autoStartMicOnConvEnd:", autoStartMicOnConvEndRef.current);
              if (autoStartMicOnConvEndRef.current) {
                console.log("🎤 对话结束（音频任务队列），自动启动麦克风");
                startMicRef.current();
              } else {
                console.log("❌ autoStartMicOnConvEnd 为 false，不启动麦克风");
              }

              resolve();
            })
        );
        break;
      default:
        console.warn("Unknown control command:", controlText);
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: MessageEvent) => {
    // 🔬 性能监控：开始计时
    const startTime = performance.now();
    
    // 📊 记录特殊消息的接收时间（用于端到端延迟分析）
    if (message.type === 'control' && message.text === 'conversation-chain-start') {
      performanceMetrics.current.messageReceiveTime.set('conversation-start', Date.now());
      console.log("🚀 对话开始");
    }
    
    console.log("Received message from server:", message);
    switch (message.type) {
      case "control":
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case "set-model-and-conf":
        setAiStateRef.current("loading");
        if (message.conf_name) {
          setConfName(message.conf_name);
        }
        if (message.client_uid) {
          setSelfUidRef.current(message.client_uid);
        }

        // ✅ 修复竞态条件：将 confUid 和 modelInfo 一起保存
        // Normalize model URL before applying to state
        if (message.model_info && !message.model_info.url.startsWith("http")) {
          const modelUrl = baseUrlRef.current + message.model_info.url;
          // eslint-disable-next-line no-param-reassign
          message.model_info.url = modelUrl;
        }

        // 组合 confUid 和 modelInfo，让 useEffect 按正确顺序处理
        if (message.conf_uid && message.model_info) {
          console.log(
            "📦 Pending Live2D model with confUid:",
            message.conf_uid
          );
          setPendingData({
            confUid: message.conf_uid,
            modelInfo: message.model_info,
          });
          toaster.create({
            title: "Loading model...",
            type: "info",
            duration: 1200,
          });
        } else if (message.conf_uid) {
          // 只有 confUid，没有 modelInfo
          setPendingData({ confUid: message.conf_uid });
        } else if (message.model_info) {
          // 只有 modelInfo，没有 confUid（不应该发生，但做防护）
          console.warn("⚠️ Received model_info without conf_uid");
          setPendingData({ modelInfo: message.model_info });
        }

        setAiStateRef.current("idle");
        break;
      case "full-text":
        if (message.text) {
          setSubtitleTextRef.current(message.text);
          // 当连接建立后，确保默认显示广告（避免旧持久化状态影响）
          if (message.text === "Connection established") {
            setShowAdvertisementsRef.current(true);
          }
        }
        break;
      case "config-files":
        if (message.configs) {
          setConfigFilesRef.current(message.configs);
        }
        break;
      case "config-switched":
        setAiStateRef.current("idle");
        setSubtitleTextRef.current("新しいキャラクターが読み込まれました");

        toaster.create({
          title: message.conf_name
            ? `Character switched: ${message.conf_name}`
            : "Character switched",
          type: "success",
          duration: 2000,
        });

        // setModelInfo(undefined);

        wsService.sendMessage({ type: "fetch-history-list" });
        wsService.sendMessage({ type: "create-new-history" });
        break;
      
      case "settings-updated":
        // 远程Web控制面板修改设置后，保存到localStorage并刷新页面
        if (message.settings) {
          console.log("📡 收到设置更新广播:", message.applied_keys);
          // const settings = message.settings; // 未使用，已注释
          
          // 字幕等UI设置由前端控制，暂时只显示通知
          // 注意：直接修改Zustand persist的localStorage会破坏数据结构，导致崩溃
          // 未来改进：实现专用的设置持久化机制
          
          // 通知用户设置已更新，并自动刷新
          toaster.create({
            title: "设置已更新",
            description: `远程控制面板修改了 ${message.applied_keys?.length || 0} 项设置。正在刷新页面...`,
            type: "info",
            duration: 2000,
          });
          
          // ✅ 2秒后自动刷新页面，应用新设置
          setTimeout(() => {
            console.log("🔄 自动刷新页面以应用新设置");
            window.location.reload();
          }, 2000);
        }
        break;
      
      case "advertisement-refresh":
        // 广告视频上传/删除后，刷新MCP广告列表
        console.log("📡 收到广告刷新通知:", message.action, message.filename);
        
        // 发送MCP刷新请求
        wsService.sendMessage({
          type: "mcp-tool-call",
          tool_name: "refresh_advertisements",
          arguments: {}
        });
        
        toaster.create({
          title: "广告列表已更新",
          description: `${message.action === 'uploaded' ? '上传' : '删除'}了广告: ${message.filename}`,
          type: "success",
          duration: 3000,
        });
        break;
      
      case "asr-settings-update":
        // 处理ASR设置更新（来自扫码控制面板）
        console.log("📡 收到ASR设置更新:", message);
        
        // 更新麦克风自动控制设置
        if (typeof message.auto_stop_mic === 'boolean') {
          setAutoStopMic(message.auto_stop_mic);
          console.log("✅ 已更新 auto_stop_mic:", message.auto_stop_mic);
        }
        if (typeof message.auto_start_mic_on_conv_end === 'boolean') {
          setAutoStartMicOnConvEnd(message.auto_start_mic_on_conv_end);
          console.log("✅ 已更新 auto_start_mic_on_conv_end:", message.auto_start_mic_on_conv_end);
        }
        if (typeof message.auto_start_mic_on === 'boolean') {
          setAutoStartMicOn(message.auto_start_mic_on);
          console.log("✅ 已更新 auto_start_mic_on:", message.auto_start_mic_on);
        }
        
        // 更新VAD阈值设置
        const vadSettings: any = {};
        if (typeof message.positive_speech_threshold === 'number') {
          vadSettings.positiveSpeechThreshold = message.positive_speech_threshold;
        }
        if (typeof message.negative_speech_threshold === 'number') {
          vadSettings.negativeSpeechThreshold = message.negative_speech_threshold;
        }
        if (typeof message.redemption_frames === 'number') {
          vadSettings.redemptionFrames = message.redemption_frames;
        }
        
        if (Object.keys(vadSettings).length > 0) {
          // ✅ 验证阈值：negativeSpeechThreshold 必须小于 positiveSpeechThreshold
          const currentState = useAppStore.getState();
          const positive = vadSettings.positiveSpeechThreshold ?? currentState.vad.settings.positiveSpeechThreshold;
          const negative = vadSettings.negativeSpeechThreshold ?? currentState.vad.settings.negativeSpeechThreshold;
          
          if (negative >= positive) {
            console.warn(`⚠️ VAD阈值验证失败: negativeSpeechThreshold (${negative}) 必须小于 positiveSpeechThreshold (${positive})`);
            // 自动修正：将negative设置为positive - 1，但至少为0
            vadSettings.negativeSpeechThreshold = Math.max(0, positive - 1);
            console.log(`✅ 已自动修正 negativeSpeechThreshold 为: ${vadSettings.negativeSpeechThreshold}`);
          }
          
          updateVADSettings(vadSettings);
          console.log("✅ 已更新VAD设置:", vadSettings);
        }
        
        toaster.create({
          title: "ASR设置已更新",
          description: "扫码控制面板的ASR设置已生效",
          type: "success",
          duration: 2000,
        });
        break;
      
      case "advertisement-audio-mode-update":
        // 处理广告音频模式更新（来自扫码控制面板）
        console.log("📡 收到广告音频模式更新:", message.audio_mode);
        
        if (message.audio_mode) {
          // 将字符串模式转换为枚举类型
          const modeMap: Record<string, AdAudioMode> = {
            'muted': AdAudioMode.MUTED,
            'audio': AdAudioMode.AUDIO,
            'audio_vad': AdAudioMode.AUDIO_VAD
          };
          
          const audioMode = modeMap[message.audio_mode];
          if (audioMode !== undefined) {
            setAdvertisementAudioMode(audioMode);
            console.log("✅ 已更新广告音频模式:", audioMode);
            
            const modeNames: Record<AdAudioMode, string> = {
              [AdAudioMode.MUTED]: '静音模式',
              [AdAudioMode.AUDIO]: '音频模式',
              [AdAudioMode.AUDIO_VAD]: '音频+VAD模式'
            };
            
            toaster.create({
              title: "广告音频模式已更新",
              description: `已切换为: ${modeNames[audioMode]}`,
              type: "success",
              duration: 2000,
            });
          } else {
            console.warn("⚠️ 无效的音频模式:", message.audio_mode);
          }
        }
        break;
      case "background-files":
        if (message.files && setBackgroundFilesRef.current) {
          setBackgroundFilesRef.current(message.files);
        }
        break;
      case "wake-word-state":
        // 处理唤醒词状态更新
        const { action, matched_word, language, advertisement_control } =
          message;

        if (action === "wake_up") {
          console.log(
            `✨ ウェイクワード検出: "${matched_word}" (${language}) - 会話開始`
          );
          // 可选：显示UI提示或更新状态指示器
        } else if (action === "sleep") {
          console.log(
            `💤 終了ワード検出: "${matched_word}" (${language}) - 会話終了`
          );
        } else if (action === "ignored") {
          console.log(`🔇 非アクティブ状態、入力無視: "${matched_word}"`);
        }

        // 🎬 处理广告轮播控制
        if (advertisement_control) {
          const { should_show_ads, control_action, trigger_reason } =
            advertisement_control;

          if (control_action === "start_ads") {
            console.log(
              `🎬 広告システム: 広告カルーセル再生開始 (理由: ${trigger_reason})`
            );
            setShowAdvertisementsRef.current(true);

            // ✅ 移除重新显示时的刷新事件，避免播放中断
            // 广告轮播会在初始化时自动加载，不需要在这里强制刷新
            console.log("✅ 广告重新显示，无需刷新避免播放中断");
            
            // ✅ 重启 VAD 逻辑
            console.log("🔊 当前 AI 状态:", aiStatusRef.current);
            console.log("🔍 触发原因:", trigger_reason);
            
            // ✅ 特殊处理：如果是 'ignored'，无条件启动 VAD
            // 因为 'ignored' 不会触发对话，不会有 conversation-chain-end
            if (trigger_reason === 'ignored') {
              console.log("🎤 重启 VAD for 广告模式 (ignored 无对话)");
              startMicRef.current().catch((e) => {
                console.error('❌ 重启VAD失败:', e);
              });
            } else if (aiStatusRef.current === 'idle') {
              console.log("🎤 重启 VAD for 广告模式 (AI idle)");
              startMicRef.current().catch((e) => {
                console.error('❌ 重启VAD失败:', e);
              });
            } else {
              console.log("⏸️ AI 正在工作，延迟到对话结束后再启动 VAD");
              // VAD 会在 conversation-chain-end 时由 autoStartMicOnConvEnd 自动启动
            }
          } else if (control_action === "stop_ads") {
            console.log(
              `🛑 広告システム: 広告再生停止 (理由: ${trigger_reason})`
            );
            setShowAdvertisementsRef.current(false);
          }

          console.log(
            `📊 広告表示状態: ${should_show_ads ? "表示" : "非表示"}`
          );
        }

        // 可以在这里添加更多的UI状态更新
        // 例如：setWakeWordState(current_state);
        break;
      case "audio":
        // AI被中断或正在听时，抑制TTS
        if (
          aiStatusRef.current === "interrupted" ||
          aiStatusRef.current === "listening"
        ) {
          console.log(
            "Audio playback intercepted. Sentence:",
            message.display_text?.text
          );
        } else {
          console.log("actions", message.actions);
          addAudioTaskRef.current({
            audioBase64: message.audio || "",
            volumes: message.volumes || [],
            sliceLength: message.slice_length || 0,
            displayText: message.display_text || null,
            expressions: message.actions?.expressions || null,
            forwarded: message.forwarded || false,
          });
        }
        break;
      case "history-data":
        if (message.messages) {
          setMessagesRef.current(message.messages);
        }
        toaster.create({
          title: "History loaded",
          type: "success",
          duration: 2000,
        });
        break;
      case "new-history-created":
        setAiStateRef.current("idle");
        setSubtitleTextRef.current("新しい会話が始まりました");
        // No need to open mic here
        if (message.history_uid) {
          setCurrentHistoryUidRef.current(message.history_uid);
          setMessagesRef.current([]);
          const newHistory: HistoryInfo = {
            uid: message.history_uid,
            latest_message: null,
            timestamp: new Date().toISOString(),
          };
          setHistoryListRef.current((prev: HistoryInfo[]) => [
            newHistory,
            ...prev,
          ]);
          toaster.create({
            title: "New chat history created",
            type: "success",
            duration: 2000,
          });
        }
        break;
      case "history-deleted":
        toaster.create({
          title: message.success
            ? "History deleted successfully"
            : "Failed to delete history",
          type: message.success ? "success" : "error",
          duration: 2000,
        });
        break;
      case "history-list":
        if (message.histories) {
          setHistoryListRef.current(message.histories);
          if (message.histories.length > 0) {
            setCurrentHistoryUidRef.current(message.histories[0].uid);
          }
        }
        break;
      case "user-input-transcription":
        console.log("user-input-transcription: ", message.text);
        if (message.text) {
          appendHumanMessageRef.current(message.text);
        }
        break;
      case "error":
        toaster.create({
          title: message.message,
          type: "error",
          duration: 2000,
        });
        break;
      case "group-update":
        console.log("Received group-update:", message.members);
        if (message.members) {
          setGroupMembersRef.current(message.members);
        }
        if (message.is_owner !== undefined) {
          setIsOwnerRef.current(message.is_owner);
        }
        break;
      case "group-operation-result":
        toaster.create({
          title: message.message,
          type: message.success ? "success" : "error",
          duration: 2000,
        });
        break;
      case "backend-synth-complete":
        setBackendSynthCompleteRef.current(true);
        break;
      case "conversation-chain-end":
        // ✅ 修复：如果没有音频任务，立即处理（否则由 handleControlMessage 处理）
        if (!audioTaskQueue.hasTask()) {
          setAiStateRef.current((currentState) => {
            if (currentState === "thinking" || currentState === "speaking") {
              return "idle";
            }
            return currentState;
          });

          // ✅ 修复：立即启动麦克风（如果开启了自动启动）
          console.log("🔍 检查 autoStartMicOnConvEnd (无音频):", autoStartMicOnConvEndRef.current);
          if (autoStartMicOnConvEndRef.current) {
            console.log("🎤 对话结束（无音频任务），自动启动麦克风");
            startMicRef.current();
          } else {
            console.log("❌ autoStartMicOnConvEnd 为 false，不启动麦克风");
          }
        }
        break;
      case "force-new-message":
        setForceNewMessage(true);
        break;
      case "interrupt-signal":
        // Handle forwarded interrupt
        interrupt(false); // do not send interrupt signal to server
        break;
      case "mcp-tool-response":
        // MCP 工具响应处理
        {
          const { tool_name, result, error } = message as any;
          
          if (error) {
            console.error("❌ MCP工具调用失败:", tool_name, error);
            // TODO: 可以显示错误提示
            toaster.create({
              title: "MCP工具调用失败",
              description: `${tool_name}: ${error}`,
              type: "error",
            });
            break;
          }
          
          // result是一个数组，包含工具执行结果
          // 在Prompt模式下，格式为: [{tool_id: "...", content: "...", is_error: false}]
          if (result && Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];
            const resultContent = firstResult?.content;
            
            if (resultContent) {
              // 处理主题介绍MCP工具的响应格式
              let contentType: string | null = null;
              let contentData: any = null;
              
              // 检查是否是主题介绍工具的响应（JSON字符串格式）
              if (typeof resultContent === 'string') {
                try {
                  const parsed = JSON.parse(resultContent);
                  if (parsed.type === 'video' || parsed.type === 'image') {
                    contentType = parsed.type;
                    contentData = {
                      url: parsed.url,
                      description: parsed.description,
                      title: parsed.topic_name || parsed.description,
                      alt: parsed.description
                    };
                    console.log("📡 解析到MCP内容:", { type: contentType, url: parsed.url });
                  }
                } catch (e) {
                  console.warn("⚠️ MCP响应不是JSON格式:", e, "原始内容:", resultContent);
                  // 不是JSON格式，尝试其他解析方式
                  if (typeof resultContent === 'object' && resultContent !== null && 'type' in resultContent) {
                    contentType = (resultContent as any).type;
                    contentData = (resultContent as any).data || resultContent;
                  }
                }
              } else if (resultContent && typeof resultContent === 'object' && resultContent !== null && 'type' in resultContent) {
                // 标准格式（对象）
                contentType = (resultContent as any).type;
                contentData = (resultContent as any).data || resultContent;
              }
              
              if (contentType && contentData) {
                console.log("📡 MCP工具响应:", tool_name, "类型:", contentType, "数据:", contentData);
                
                // 如果是视频，立即设置AI状态为waiting（静音）
                if (contentType === 'video') {
                  setAiStateRef.current('waiting');
                  console.log("🎬 视频内容：AI已设置为waiting状态（静音）");
                }
                // 如果是图片，AI保持正常说话（不需要特殊处理）
                
                // 调用 Store 方法显示 MCP 内容
                showMCPContent(contentType as any, contentData);
                console.log("🎨 MCP Canvas: 内容已加载", { type: contentType, data: contentData });
              } else {
                console.log("📡 MCP工具响应（无有效内容）:", tool_name, "原始结果:", result);
              }
            } else {
              console.log("📡 MCP工具响应（无content字段）:", tool_name, "结果:", firstResult);
            }
          } else {
            console.log("📡 MCP工具响应（结果为空或格式错误）:", tool_name, "结果:", result);
          }
        }
        break;
      case "tool_call_status":
        // MCP工具执行状态更新（用于显示第二画布）
        {
          const { tool_name, status, content } = message as any;
          
          // 只处理完成状态的主题图片/视频工具
          if (status === "completed" && content && (tool_name === "get_topic_image" || tool_name === "get_topic_video")) {
            try {
              const parsed = typeof content === 'string' ? JSON.parse(content) : content;
              
              if (parsed.type === 'image' || parsed.type === 'video') {
                const contentType = parsed.type;
                
                // ✅ 修复URL：确保有http://前缀
                let imageUrl = parsed.url;
                if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                  // 如果URL以127.0.0.1或localhost开头，添加http://
                  if (imageUrl.startsWith('127.0.0.1') || imageUrl.startsWith('localhost')) {
                    imageUrl = `http://${imageUrl}`;
                  } else {
                    // 否则假设是相对路径，添加基础URL
                    imageUrl = `http://127.0.0.1:12393${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                  }
                  console.log("🔧 URL已修复:", { 原始: parsed.url, 修复后: imageUrl });
                }
                
                const contentData = {
                  url: imageUrl,
                  description: parsed.description,
                  title: parsed.topic_name || parsed.description,
                  alt: parsed.description
                };
                
                console.log("📡 从tool_call_status解析到MCP内容:", { type: contentType, url: imageUrl });
                
                // 如果是视频，立即设置AI状态为waiting（静音）
                if (contentType === 'video') {
                  setAiStateRef.current('waiting');
                  console.log("🎬 视频内容：AI已设置为waiting状态（静音）");
                }
                
                // 调用 Store 方法显示 MCP 内容
                showMCPContent(contentType as any, contentData);
                console.log("🎨 MCP Canvas: 内容已从tool_call_status加载", { type: contentType, data: contentData });
              }
            } catch (e) {
              console.warn("⚠️ 解析tool_call_status内容失败:", e, "原始内容:", content);
            }
          }
        }
        break;
      case "adaptive-vad-response":
        // 自适应VAD控制响应
        if (message.success) {
          console.log(`✅ VAD控制操作 '${message.action}' 成功执行`);
        } else {
          console.warn(`❌ VAD控制操作失败: ${message.error}`);
        }
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
    
    // 🔬 性能监控：结束计时并统计
    const processingTime = performance.now() - startTime;
    const metrics = performanceMetrics.current;
    metrics.messageCount++;
    metrics.totalProcessingTime += processingTime;
    
    // 记录慢消息（超过 10ms）
    if (processingTime > 10) {
      metrics.slowMessages.push({ type: message.type, time: processingTime });
      console.warn('⚠️ 慢消息处理:', message.type, processingTime.toFixed(2), 'ms');
    }
    
    // 📊 记录端到端延迟（从对话开始到第一个音频）
    if (message.type === 'audio' && metrics.messageReceiveTime.has('conversation-start')) {
      const startTime = metrics.messageReceiveTime.get('conversation-start')!;
      const endToEndDelay = Date.now() - startTime;
      console.log('⏱️ 端到端延迟（从对话开始到首个音频）:', endToEndDelay, 'ms');
      metrics.messageReceiveTime.delete('conversation-start');
    }
  }, []);

  // 🔬 性能监控：定期输出统计（开发环境）
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    
    const interval = setInterval(() => {
      const metrics = performanceMetrics.current;
      if (metrics.messageCount > 0) {
        const avgTime = metrics.totalProcessingTime / metrics.messageCount;
        console.log('📊 性能统计（过去 60 秒）:', {
          消息数: metrics.messageCount,
          平均处理时间: avgTime.toFixed(2) + 'ms',
          慢消息数: metrics.slowMessages.length,
          慢消息类型: metrics.slowMessages.slice(-5).map(m => `${m.type}(${m.time.toFixed(1)}ms)`),
        });
        // 重置统计（滚动窗口）
        metrics.messageCount = 0;
        metrics.totalProcessingTime = 0;
        metrics.slowMessages = [];
      }
    }, 60000);  // 每 60 秒
    
    return () => clearInterval(interval);
  }, []);
  
  // 分离连接管理和订阅管理，确保正确清理
  useEffect(() => {
    console.log("🔌 WebSocketHandler: 初始化WebSocket连接", wsUrl);
    wsService.connect(wsUrl);

    return () => {
      console.log("🔌 WebSocketHandler: 组件卸载，断开WebSocket连接");
      // 组件卸载时主动断开连接，避免悬挂的WebSocket
      wsService.disconnect();
    };
  }, [wsUrl]);

  useEffect(() => {
    console.log("📡 WebSocketHandler: 设置订阅监听器");
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);

    // 开发环境下监控订阅数量
    const monitorInterval =
      process.env.NODE_ENV === "development"
        ? setInterval(() => {
            const counts = wsService.getSubscriptionCount();
            console.debug("📊 订阅监控:", counts);
            if (counts.message > 2 || counts.state > 2) {
              console.warn("⚠️  检测到订阅泄漏！订阅数量异常:", counts);
            }
          }, 30000) // 每30秒检查一次
        : null;

    // ✅ 统一的清理函数，避免条件分支
    return () => {
      // 清理监控定时器
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }

      console.log("📡 WebSocketHandler: 清理订阅监听器");
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();

      // 开发环境下检查最终订阅数量
      if (process.env.NODE_ENV === "development") {
        const finalCounts = wsService.getSubscriptionCount();
        console.log("📊 清理后订阅数量:", finalCounts);
      }
    };
  }, [handleWebSocketMessage]); // 移除 wsUrl 依赖，避免 URL 变化时重复订阅

  // ✅ Context value - 使用 Store 的 updateNetworkConfig 更新配置
  const webSocketContextValue = useMemo(
    () => ({
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
    }),
    [wsState, wsUrl, baseUrl, updateNetworkConfig]
  );

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
});

export default WebSocketHandler;
