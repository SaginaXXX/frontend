/* eslint-disable no-use-before-define */
import {
  createContext, useContext, useRef, useCallback, useEffect, useReducer, useMemo,
} from 'react';
// import * as VADWeb from '@ricky0123/vad-web';
import { useInterrupt } from '@/components/canvas/live2d';
import { audioTaskQueue } from '@/utils/task-queue';
import { useSendAudio } from '@/hooks/utils/use-send-audio';
import { useAiStore, useChatStore, useVADStore } from '@/store';
import { toaster } from '@/components/ui/toaster';
import { adAudioMonitor } from '@/utils/advertisement-audio-monitor';

/**
 * VAD settings configuration interface
 * @interface VADSettings
 */
export interface VADSettings {
  /** Threshold for positive speech detection (0-100) */
  positiveSpeechThreshold: number;

  /** Threshold for negative speech detection (0-100) */
  negativeSpeechThreshold: number;

  /** Number of frames for speech redemption */
  redemptionFrames: number;
}

/**
 * VAD context state interface
 * @interface VADState
 */
interface VADState {
  /** Auto stop mic feature state */
  autoStopMic: boolean;

  /** Microphone active state */
  micOn: boolean;

  /** Set microphone state */
  setMicOn: (value: boolean) => void;

  /** Set Auto stop mic state */
  setAutoStopMic: (value: boolean) => void;

  /** Start microphone and VAD */
  startMic: () => Promise<void>;

  /** Stop microphone and VAD */
  stopMic: () => void;

  /** Previous speech probability value */
  previousTriggeredProbability: number;

  /** Set previous speech probability */
  setPreviousTriggeredProbability: (value: number) => void;

  /** VAD settings configuration */
  settings: VADSettings;

  /** Update VAD settings */
  updateSettings: (newSettings: VADSettings) => void;

  /** Auto start microphone when AI starts speaking */
  autoStartMicOn: boolean;

  /** Set auto start microphone state */
  setAutoStartMicOn: (value: boolean) => void;

  /** Auto start microphone when conversation ends */
  autoStartMicOnConvEnd: boolean;

  /** Set auto start microphone when conversation ends state */
  setAutoStartMicOnConvEnd: (value: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_VAD_SETTINGS: VADSettings = {
  positiveSpeechThreshold: 50,
  negativeSpeechThreshold: 35,
  redemptionFrames: 35,
};

/**
 * Create the VAD context
 */
export const VADContext = createContext<VADState | null>(null);

/**
 * VAD Provider Component
 * Manages voice activity detection and microphone state
 *
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function VADProvider({ children }: { children: React.ReactNode }) {
  // Refs for VAD instance and state
  const vadRef = useRef<any | null>(null);
  const previousTriggeredProbabilityRef = useRef(0);

  // ✅ 从 Zustand Store 读取所有 VAD 状态（单一数据源）
  const vadStore = useVADStore();
  const { 
    micOn, 
    autoStopMic, 
    settings, 
    autoStartMicOn, 
    autoStartMicOnConvEnd,
    setMicState,
    updateVADSettings,
    setAutoStopMic: setAutoStopMicStore,
    setAutoStartMicOn: setAutoStartMicOnStore,
    setAutoStartMicOnConvEnd: setAutoStartMicOnConvEndStore,
  } = vadStore;

  // Refs for stable access in callbacks
  const autoStopMicRef = useRef(autoStopMic);
  const autoStartMicRef = useRef(autoStartMicOn);
  const autoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  
  const baseVadSettingsRef = useRef<VADSettings>(settings);
  const elevatedRef = useRef(false);
  const lastSwitchTimeRef = useRef(0);

  // Force update mechanism for ref updates
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // External hooks and contexts
  const { interrupt } = useInterrupt();
  const { sendAudioPartition } = useSendAudio();
  const { setSubtitleText } = useChatStore();
  const { status: aiState, setAiState } = useAiStore();

  // Refs for callback stability
  const interruptRef = useRef(interrupt);
  const sendAudioPartitionRef = useRef(sendAudioPartition);
  const aiStateRef = useRef<string>(aiState);
  const setSubtitleTextRef = useRef(setSubtitleText);
  const setAiStateRef = useRef(setAiState);

  const isProcessingRef = useRef(false);

  // Update refs when dependencies change
  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    interruptRef.current = interrupt;
  }, [interrupt]);

  useEffect(() => {
    sendAudioPartitionRef.current = sendAudioPartition;
  }, [sendAudioPartition]);

  useEffect(() => {
    setSubtitleTextRef.current = setSubtitleText;
  }, [setSubtitleText]);

  useEffect(() => {
    setAiStateRef.current = setAiState;
  }, [setAiState]);

  // ✅ 同步 Store 状态到 Refs
  useEffect(() => {
    autoStopMicRef.current = autoStopMic;
  }, [autoStopMic]);

  useEffect(() => {
    autoStartMicRef.current = autoStartMicOn;
  }, [autoStartMicOn]);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, [autoStartMicOnConvEnd]);

  /**
   * Update previous triggered probability and force re-render
   */
  const setPreviousTriggeredProbability = useCallback((value: number) => {
    previousTriggeredProbabilityRef.current = value;
    forceUpdate();
  }, []);

  /**
   * Handle speech start event
   */
  const handleSpeechStart = useCallback(() => {
    if (isProcessingRef.current) {
      // Drop duplicate starts while already processing
      return;
    }
    console.log('Speech started');
    if (aiStateRef.current === 'thinking' || aiStateRef.current === 'speaking') {
      interruptRef.current();
    }
    isProcessingRef.current = true;
    setAiStateRef.current('listening');
  }, []);

  /**
   * Handle frame processing event
   */
  const handleFrameProcessed = useCallback((probs: { isSpeech: number }) => {
    if (probs.isSpeech > previousTriggeredProbabilityRef.current) {
      setPreviousTriggeredProbability(probs.isSpeech);
    }
  }, []);

  /**
   * Handle speech end event
   */
  const handleSpeechEnd = useCallback((audio: Float32Array) => {
    if (!isProcessingRef.current) return;
    console.log('Speech ended');
    audioTaskQueue.clearQueue();

    if (autoStopMicRef.current) {
      stopMic();
    } else {
      console.log('Auto stop mic is on, keeping mic active');
    }

    setPreviousTriggeredProbability(0);
    sendAudioPartitionRef.current(audio);
    isProcessingRef.current = false;
  }, []);

  /**
   * Handle VAD misfire event
   */
  const handleVADMisfire = useCallback(() => {
    if (!isProcessingRef.current) return;
    console.log('VAD misfire detected');
    setPreviousTriggeredProbability(0);
    isProcessingRef.current = false;

    if (aiStateRef.current === 'interrupted' || aiStateRef.current === 'listening') {
      setAiStateRef.current('idle');
    }
    setSubtitleTextRef.current("聞こえないよ〜");
  }, []);

  /**
   * Update VAD settings and restart if active
   */
  const updateSettings = useCallback((newSettings: VADSettings) => {
    // ✅ 更新 Store 中的设置
    updateVADSettings(newSettings);
    if (vadRef.current) {
      stopMic();
      setTimeout(() => {
        startMic();
      }, 100);
    }
  }, [updateVADSettings]);

  // Initialize baseline once on mount
  useEffect(() => {
    baseVadSettingsRef.current = settings;
  }, []);

  // Keep baseline in sync when user changes settings and ad is not playing
  useEffect(() => {
    if (!elevatedRef.current) {
      baseVadSettingsRef.current = settings;
    }
  }, [settings]);

  // Dynamically adapt frontend VAD sensitivity when advertisement audio is playing
  useEffect(() => {
    const handleAdAudioUpdate = (info: any) => {
      const now = Date.now();
      const sinceLast = now - (lastSwitchTimeRef.current || 0);

      if (info?.isPlaying && !elevatedRef.current) {
        if (sinceLast < 1500) return; // debounce flips
        elevatedRef.current = true;
        lastSwitchTimeRef.current = now;

        const volume = Math.max(0, Math.min(1, info?.volume ?? 0.5));
        const boost = Math.round(15 + 15 * volume); // 15~30 points depending on volume

        const newSettings: VADSettings = {
          positiveSpeechThreshold: Math.min(
            95,
            (baseVadSettingsRef.current?.positiveSpeechThreshold ?? DEFAULT_VAD_SETTINGS.positiveSpeechThreshold) + boost,
          ),
          negativeSpeechThreshold: Math.min(
            90,
            (baseVadSettingsRef.current?.negativeSpeechThreshold ?? DEFAULT_VAD_SETTINGS.negativeSpeechThreshold) + Math.round(boost * 0.8),
          ),
          redemptionFrames: (baseVadSettingsRef.current?.redemptionFrames ?? DEFAULT_VAD_SETTINGS.redemptionFrames) + 20,
        };
        updateSettings(newSettings);
      } else if (!info?.isPlaying && elevatedRef.current) {
        if (sinceLast < 1500) return; // debounce flips
        elevatedRef.current = false;
        lastSwitchTimeRef.current = now;
        // Restore baseline user settings
        updateSettings(baseVadSettingsRef.current);
      }
    };

    adAudioMonitor.addCallback(handleAdAudioUpdate);
    return () => {
      try { adAudioMonitor.removeCallback(handleAdAudioUpdate); } catch (_) {}
    };
  }, [updateSettings]);

  /**
   * Initialize new VAD instance
   */
  const initVAD = async () => {
    // Ensure onnxruntime-web loads its wasm from our static /libs path
    try {
      const ort = await import('onnxruntime-web');
      // point to vite-served static copies
      // e.g. /libs/ort-wasm-simd.wasm, /libs/ort-wasm.wasm, ...
      // these are copied via vite-plugin-static-copy
      // @ts-ignore
      ort.env.wasm.wasmPaths = '/libs/';
      // light defaults to improve compatibility
      // @ts-ignore
      ort.env.wasm.numThreads = 1;
      // @ts-ignore
      ort.env.wasm.simd = true;
    } catch (e) {
      console.warn('onnxruntime-web not available, proceeding anyway:', e);
    }

    const VADWeb = await import('@ricky0123/vad-web');
    const newVAD = await VADWeb.MicVAD.new({
      model: "v5",
      preSpeechPadFrames: 20,
      positiveSpeechThreshold: settings.positiveSpeechThreshold / 100,
      negativeSpeechThreshold: settings.negativeSpeechThreshold / 100,
      redemptionFrames: settings.redemptionFrames,
      baseAssetPath: '/libs/',
      onnxWASMBasePath: '/libs/',
      onSpeechStart: handleSpeechStart,
      onFrameProcessed: handleFrameProcessed,
      onSpeechEnd: handleSpeechEnd,
      onVADMisfire: handleVADMisfire,
    });

    vadRef.current = newVAD;
    newVAD.start();
  };

  /**
   * Start microphone and VAD processing
   */
  const startMic = useCallback(async () => {
    try {
      if (!vadRef.current) {
        console.log('Initializing VAD');
        await initVAD();
      } else {
        console.log('Starting VAD');
        vadRef.current.start();
      }
      // ✅ 更新 Store 中的麦克风状态
      setMicState(true);
    } catch (error) {
      console.error('Failed to start VAD:', error);
      toaster.create({
        title: `Failed to start VAD: ${error}`,
        type: 'error',
        duration: 2000,
      });
    }
  }, [setMicState]);

  /**
   * Stop microphone and VAD processing
   */
  const stopMic = useCallback(() => {
    console.log('Stopping VAD');
    if (vadRef.current) {
      vadRef.current.pause();
      vadRef.current.destroy();
      vadRef.current = null;
      console.log('VAD stopped and destroyed successfully');
      setPreviousTriggeredProbability(0);
    } else {
      console.log('VAD instance not found');
    }
    // ✅ 更新 Store 中的麦克风状态
    setMicState(false);
    isProcessingRef.current = false;
  }, [setMicState]);

  /**
   * Set Auto stop mic state
   */
  const setAutoStopMic = useCallback((value: boolean) => {
    autoStopMicRef.current = value;
    // ✅ 使用 Store 的 setter 方法（不能直接赋值）
    setAutoStopMicStore(value);
    forceUpdate();
  }, [setAutoStopMicStore]);

  const setAutoStartMicOn = useCallback((value: boolean) => {
    autoStartMicRef.current = value;
    // ✅ 使用 Store 的 setter 方法（不能直接赋值）
    setAutoStartMicOnStore(value);
    forceUpdate();
  }, [setAutoStartMicOnStore]);

  const setAutoStartMicOnConvEnd = useCallback((value: boolean) => {
    autoStartMicOnConvEndRef.current = value;
    // ✅ 使用 Store 的 setter 方法（不能直接赋值）
    setAutoStartMicOnConvEndStore(value);
    forceUpdate();
  }, [setAutoStartMicOnConvEndStore]);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      autoStopMic: autoStopMicRef.current,
      micOn,
      setMicOn: setMicState, // ✅ 使用 Store 的 setter
      setAutoStopMic,
      startMic,
      stopMic,
      previousTriggeredProbability: previousTriggeredProbabilityRef.current,
      setPreviousTriggeredProbability,
      settings,
      updateSettings,
      autoStartMicOn: autoStartMicRef.current,
      setAutoStartMicOn,
      autoStartMicOnConvEnd: autoStartMicOnConvEndRef.current,
      setAutoStartMicOnConvEnd,
    }),
    [
      micOn,
      setMicState,
      setAutoStopMic,
      setAutoStartMicOn,
      setAutoStartMicOnConvEnd,
      startMic,
      stopMic,
      settings,
      updateSettings,
    ],
  );

  // Ensure microphone/VAD resources are released on unmount
  useEffect(() => {
    return () => {
      try {
        if (vadRef.current) {
          vadRef.current.pause();
          vadRef.current.destroy();
          vadRef.current = null;
        }
      } catch (_) {}
      try {
        setPreviousTriggeredProbability(0);
      } catch (_) {}
    };
  }, []);

  return (
    <VADContext.Provider value={contextValue}>
      {children}
    </VADContext.Provider>
  );
}

/**
 * Custom hook to use the VAD context
 * @throws {Error} If used outside of VADProvider
 */
export const useVAD = () => {
  const context = useContext(VADContext);

  if (!context) {
    throw new Error('useVAD must be used within a VADProvider');
  }

  return context;
}
