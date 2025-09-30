import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

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

// Hook Props接口
interface UseAdvertisementAudioSettingsProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

// 默认设置
const defaultSettings: AdvertisementAudioSettings = {
  audioMode: AdAudioMode.AUDIO_VAD,  // 默认启用音声+VAD模式
  autoSwitchNext: true,
  cleanPlaybackExperience: true,
  supportAnyLength: true,
};

export const useAdvertisementAudioSettings = ({ 
  onSave, 
  onCancel 
}: UseAdvertisementAudioSettingsProps = {}) => {
  // 持久化存储的设置
  const [persistedSettings, setPersistedSettings] = useLocalStorage<AdvertisementAudioSettings>(
    'advertisementAudioSettings',
    defaultSettings
  );

  // 临时设置状态（用于编辑时的预览）
  const [tempSettings, setTempSettings] = useState<AdvertisementAudioSettings>(persistedSettings);
  
  // 原始设置状态（用于取消时恢复）
  const [originalSettings, setOriginalSettings] = useState<AdvertisementAudioSettings>(persistedSettings);

  // 当持久化设置变化时更新临时和原始状态
  useEffect(() => {
    setOriginalSettings(persistedSettings);
    setTempSettings(persistedSettings);
  }, [persistedSettings]);

  // 音频模式切换处理器
  const handleAudioModeChange = useCallback((mode: AdAudioMode) => {
    setTempSettings(prev => ({
      ...prev,
      audioMode: mode
    }));
  }, []);

  // 保存设置
  const handleSave = useCallback(() => {
    setPersistedSettings(tempSettings);
    setOriginalSettings(tempSettings);
    console.log('💾 广告音频设置已保存:', tempSettings);
  }, [tempSettings, setPersistedSettings]);

  // 取消设置（恢复到原始状态）
  const handleCancel = useCallback(() => {
    setTempSettings(originalSettings);
    console.log('↩️ 广告音频设置已取消，恢复到:', originalSettings);
  }, [originalSettings]);

  // 注册保存/取消回调
  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  // 计算衍生属性
  const isAudioEnabled = tempSettings.audioMode !== AdAudioMode.MUTED;
  const isVADEnabled = tempSettings.audioMode === AdAudioMode.AUDIO_VAD;

  return {
    // 设置状态
    settings: tempSettings,
    persistedSettings,
    originalSettings,
    
    // 衍生属性
    isAudioEnabled,
    isVADEnabled,
    
    // 处理器函数
    handleAudioModeChange,
    handleSave,
    handleCancel,
    
    // 便捷的模式检查函数
    isMutedMode: tempSettings.audioMode === AdAudioMode.MUTED,
    isAudioMode: tempSettings.audioMode === AdAudioMode.AUDIO,
    isAudioVADMode: tempSettings.audioMode === AdAudioMode.AUDIO_VAD,
  };
};

// 导出便捷hook用于其他组件访问持久化设置
export const useAdvertisementAudioConfig = () => {
  const [settings] = useLocalStorage<AdvertisementAudioSettings>(
    'advertisementAudioSettings',
    defaultSettings
  );
  
  return {
    settings,
    isAudioEnabled: settings.audioMode !== AdAudioMode.MUTED,
    isVADEnabled: settings.audioMode === AdAudioMode.AUDIO_VAD,
    audioMode: settings.audioMode,
  };
};