/**
 * Media 状态 Slice
 * 管理媒体相关状态（Live2D、背景、广告等）
 */

import { StateCreator } from 'zustand';
import { MediaState, ModelInfo, AdAudioMode, AdvertisementAudioSettings } from '../types';
import { initialMediaState } from '../initial-states';

export interface MediaSlice {
  media: MediaState;
  
  // 通用媒体操作
  updateMediaState: (updates: Partial<MediaState>) => void;
  
  // 背景管理
  setBackgroundUrl: (url: string) => void;
  setBackgroundFiles: (files: any[]) => void;
  setUseCameraBackground: (use: boolean) => void;
  
  // 广告管理
  setShowAdvertisements: (show: boolean) => void;
  setAdvertisements: (ads: any[]) => void;
  
  // Live2D 配置管理
  setLive2DModelInfo: (info: ModelInfo | undefined, confUid?: string, isPet?: boolean) => void;
  updateLive2DScale: (scale: number, confUid: string, isPet: boolean) => void;
  setLive2DLoading: (loading: boolean) => void;
  
  // 广告音频管理
  setAdvertisementAudioMode: (mode: AdAudioMode) => void;
  updateAdvertisementAudioSettings: (settings: Partial<AdvertisementAudioSettings>) => void;
}

export const createMediaSlice: StateCreator<
  MediaSlice,
  [['zustand/immer', never]]
> = (set) => ({
  media: initialMediaState,

  // =========================
  // 通用媒体操作
  // =========================
  updateMediaState: (updates) => {
    set((draft) => {
      Object.assign(draft.media, updates);
    });
  },

  // =========================
  // 背景管理
  // =========================
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

  // =========================
  // 广告管理
  // =========================
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
  // Live2D 配置管理
  // =========================
  setLive2DModelInfo: (info, confUid, isPet) => {
    set((draft) => {
      if (!info?.url) {
        console.log("⏭️ setLive2DModelInfo: No URL provided, skipping");
        return;
      }

      if (!confUid) {
        console.warn("⚠️ setLive2DModelInfo: No confUid provided");
        return;
      }

      // ✅ 防御性初始化
      if (!draft.media.live2d) {
        draft.media.live2d = initialMediaState.live2d;
      }

      const storageKey = `${confUid}_${isPet ? "pet" : "window"}`;
      
      let finalScale: number;
      const storedScale = draft.media.live2d.scaleMemory[storageKey];
      
      if (storedScale !== undefined && !isNaN(storedScale)) {
        finalScale = storedScale;
      } else {
        const rawScale = Number(info.kScale);
        finalScale = (isNaN(rawScale) || rawScale <= 0) ? 0.5 : rawScale;
        draft.media.live2d.scaleMemory[storageKey] = finalScale;
      }

      draft.media.live2d.modelInfo = {
        ...info,
        kScale: finalScale,
        pointerInteractive: 'pointerInteractive' in info 
          ? info.pointerInteractive 
          : (draft.media.live2d.modelInfo?.pointerInteractive ?? false),
        scrollToResize: 'scrollToResize' in info 
          ? info.scrollToResize 
          : (draft.media.live2d.modelInfo?.scrollToResize ?? true),
      };
    });
  },

  updateLive2DScale: (newScale, confUid, isPet) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.media.live2d) {
        draft.media.live2d = initialMediaState.live2d;
      }
      
      const storageKey = `${confUid}_${isPet ? "pet" : "window"}`;
      const fixedScale = Number(newScale.toFixed(8));
      
      draft.media.live2d.scaleMemory[storageKey] = fixedScale;
      
      if (draft.media.live2d.modelInfo) {
        draft.media.live2d.modelInfo.kScale = fixedScale;
      }
    });
  },

  setLive2DLoading: (loading) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.media.live2d) {
        draft.media.live2d = initialMediaState.live2d;
      }
      draft.media.live2d.isLoading = loading;
    });
  },

  // =========================
  // 广告音频管理
  // =========================
  setAdvertisementAudioMode: (mode) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.media.advertisementAudio) {
        draft.media.advertisementAudio = initialMediaState.advertisementAudio;
      }
      draft.media.advertisementAudio.audioMode = mode;
    });
  },

  updateAdvertisementAudioSettings: (settings) => {
    set((draft) => {
      // ✅ 防御性初始化
      if (!draft.media.advertisementAudio) {
        draft.media.advertisementAudio = initialMediaState.advertisementAudio;
      }
      Object.assign(draft.media.advertisementAudio, settings);
    });
  },
});

