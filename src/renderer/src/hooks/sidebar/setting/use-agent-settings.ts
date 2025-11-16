import { useCallback, useEffect, useState } from 'react';
import { useProactiveStore } from '@/store';

interface UseAgentSettingsProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

export function useAgentSettings({ onSave, onCancel }: UseAgentSettingsProps = {}) {
  // 从 Store 获取主动说话设置
  const { 
    allowProactiveSpeak, 
    idleSecondsToSpeak, 
    allowButtonTrigger,
    updateProactiveSettings 
  } = useProactiveStore();

  const persistedSettings = {
    allowProactiveSpeak,
    idleSecondsToSpeak,
    allowButtonTrigger,
  };

  const [tempSettings, setTempSettings] = useState(persistedSettings);
  const [originalSettings, setOriginalSettings] = useState(persistedSettings);

  useEffect(() => {
    setOriginalSettings(persistedSettings);
    setTempSettings(persistedSettings);
  }, [allowProactiveSpeak, idleSecondsToSpeak, allowButtonTrigger]);

  const handleAllowProactiveSpeakChange = useCallback((checked: boolean) => {
    setTempSettings((prev) => ({
      ...prev,
      allowProactiveSpeak: checked,
    }));
  }, []);

  const handleIdleSecondsChange = useCallback((value: number) => {
    setTempSettings((prev) => ({
      ...prev,
      idleSecondsToSpeak: value,
    }));
  }, []);

  const handleAllowButtonTriggerChange = useCallback((checked: boolean) => {
    setTempSettings((prev) => ({
      ...prev,
      allowButtonTrigger: checked,
    }));
  }, []);

  const handleSave = useCallback(() => {
    updateProactiveSettings(tempSettings);
    setOriginalSettings(tempSettings);
  }, [updateProactiveSettings, tempSettings]);

  const handleCancel = useCallback(() => {
    setTempSettings(originalSettings);
    updateProactiveSettings(originalSettings);
  }, [originalSettings, updateProactiveSettings]);

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return {
    settings: tempSettings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
  };
}
