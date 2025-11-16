import React, { useRef, useState, useEffect } from 'react';
import { useVADStore } from '@/store';

// VAD 设置接口
export interface VADSettings {
  positiveSpeechThreshold: number;
  negativeSpeechThreshold: number;
  redemptionFrames: number;
  frameSamples: number;
  minSpeechFrames: number;
  vadMode: number;
}

export const useASRSettings = () => {
  const {
    settings,
    updateVADSettings,
    autoStopMic,
    setAutoStopMic,
    autoStartMicOn,
    setAutoStartMicOn,
    autoStartMicOnConvEnd,
    setAutoStartMicOnConvEnd,
  } = useVADStore();

  const localSettingsRef = useRef<VADSettings>(settings);
  const originalSettingsRef = useRef(settings);
  const originalAutoStopMicRef = useRef(autoStopMic);
  const originalAutoStartMicOnRef = useRef(autoStartMicOn);
  const originalAutoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  const [localVoiceInterruption, setLocalVoiceInterruption] = useState(autoStopMic);
  const [localAutoStartMic, setLocalAutoStartMic] = useState(autoStartMicOn);
  const [localAutoStartMicOnConvEnd, setLocalAutoStartMicOnConvEnd] = useState(autoStartMicOnConvEnd);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    setLocalVoiceInterruption(autoStopMic);
    setLocalAutoStartMic(autoStartMicOn);
    setLocalAutoStartMicOnConvEnd(autoStartMicOnConvEnd);
  }, [autoStopMic, autoStartMicOn, autoStartMicOnConvEnd]);

  const handleInputChange = (key: keyof VADSettings, value: number | string): void => {
    if (value === '' || value === '-') {
      localSettingsRef.current = { ...localSettingsRef.current, [key]: value };
    } else {
      const parsed = Number(value);
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(parsed)) {
        localSettingsRef.current = { ...localSettingsRef.current, [key]: parsed };
      }
    }
    forceUpdate();
  };

  const handleVoiceInterruptionChange = (value: boolean) => {
    setLocalVoiceInterruption(value);
    setAutoStopMic(value);
  };

  const handleAutoStartMicChange = (value: boolean) => {
    setLocalAutoStartMic(value);
    setAutoStartMicOn(value);
  };

  const handleAutoStartMicOnConvEndChange = (value: boolean) => {
    setLocalAutoStartMicOnConvEnd(value);
    setAutoStartMicOnConvEnd(value);
  };

  const handleSave = (): void => {
    updateVADSettings(localSettingsRef.current);
    originalSettingsRef.current = localSettingsRef.current;
    originalAutoStopMicRef.current = localVoiceInterruption;
    originalAutoStartMicOnRef.current = localAutoStartMic;
    originalAutoStartMicOnConvEndRef.current = localAutoStartMicOnConvEnd;
  };

  const handleCancel = (): void => {
    localSettingsRef.current = originalSettingsRef.current;
    setLocalVoiceInterruption(originalAutoStopMicRef.current);
    setLocalAutoStartMic(originalAutoStartMicOnRef.current);
    setAutoStopMic(originalAutoStopMicRef.current);
    setAutoStartMicOn(originalAutoStartMicOnRef.current);
    setLocalAutoStartMicOnConvEnd(originalAutoStartMicOnConvEndRef.current);
    setAutoStartMicOnConvEnd(originalAutoStartMicOnConvEndRef.current);
    forceUpdate();
  };

  return {
    localSettings: localSettingsRef.current,
    autoStopMic: localVoiceInterruption,
    autoStartMicOn: localAutoStartMic,
    autoStartMicOnConvEnd: localAutoStartMicOnConvEnd,
    setAutoStopMic: handleVoiceInterruptionChange,
    setAutoStartMicOn: handleAutoStartMicChange,
    setAutoStartMicOnConvEnd: handleAutoStartMicOnConvEndChange,
    handleInputChange,
    handleSave,
    handleCancel,
  };
};
