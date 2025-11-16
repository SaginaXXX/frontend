import { useState, useEffect } from 'react';
import { useAppStore, type ModelInfo } from '@/store';
import { useConfig } from '@/context/character-config-context';

// 导出类型供其他组件使用
export type { ModelInfo };

export const useLive2dSettings = () => {
  // ✅ 精确订阅，避免过度订阅
  const live2d = useAppStore((s) => s.media.live2d);
  const setLive2DModelInfo = useAppStore((s) => s.setLive2DModelInfo);
  const { confUid } = useConfig();
  const [isPet, setIsPet] = useState(false);

  useEffect(() => {
    const unsubscribe = (window.api as any)?.onModeChanged((mode: string) => {
      setIsPet(mode === "pet");
    });
    return () => unsubscribe?.();
  }, []);

  const initialModelInfo: ModelInfo = {
    url: '',
    kScale: 0.5,
    initialXshift: 0,
    initialYshift: 0,
    emotionMap: {},
    scrollToResize: true,
  };

  const [modelInfo, setModelInfoState] = useState<ModelInfo>(
    live2d.modelInfo || initialModelInfo,
  );
  const [originalModelInfo, setOriginalModelInfo] = useState<ModelInfo>(
    live2d.modelInfo || initialModelInfo,
  );

  useEffect(() => {
    if (live2d.modelInfo) {
      if (JSON.stringify(live2d.modelInfo) !== JSON.stringify(originalModelInfo)) {
        setOriginalModelInfo(live2d.modelInfo);
        setModelInfoState(live2d.modelInfo);
      }
    }
  }, [live2d.modelInfo]);

  useEffect(() => {
    if (modelInfo && confUid) {
      setLive2DModelInfo(modelInfo, confUid, isPet);
    }
  }, [modelInfo.pointerInteractive, modelInfo.scrollToResize, modelInfo.emotionMap]);

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    setModelInfoState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (): void => {
    if (modelInfo && confUid) {
      setOriginalModelInfo(modelInfo);
    }
  };

  const handleCancel = (): void => {
    setModelInfoState(originalModelInfo);
    if (originalModelInfo && confUid) {
      setLive2DModelInfo(originalModelInfo, confUid, isPet);
    }
  };

  return {
    modelInfo,
    handleInputChange,
    handleSave,
    handleCancel,
  };
};
