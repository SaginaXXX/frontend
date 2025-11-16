import { useState, useEffect } from 'react';

/* 有两种模式：窗口模式和宠物模式 一共四个状态：窗口模式、宠物模式、窗口模式全屏、宠物模式全屏

使用接口描述 Hook最终返回描述的样子，比如：
{
  mode: 'window',
  isElectron: true,
  isFullscreen: false
}
 */



// 应用模式类型
export type AppMode = 'window' | 'pet';

// 应用模式返回接口
export interface UseAppModeReturn {
  mode: AppMode;  // 应用模式
  isElectron: boolean; // 是否是Electron模式
  isFullscreen: boolean; // 是否是全屏模式
}

/**
 * 管理应用模式（window/pet）和 Electron 相关状态
 */
export function useAppMode(): UseAppModeReturn {
  const [mode, setMode] = useState<AppMode>('window');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isElectron = window.api !== undefined;

  // 监听全屏状态变化
  useEffect(() => {
    if (isElectron && window.api?.onFullscreenChange) {
      const cleanup = window.api.onFullscreenChange((fullscreen: boolean) => {
        setIsFullscreen(fullscreen);
      });
      return cleanup;
    }
  }, [isElectron]);

  // 监听模式预变化（准备阶段）
  useEffect(() => {
    if (isElectron) {
      const preModeHandler = (_event: any, newMode: any) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.electron.ipcRenderer.send('renderer-ready-for-mode-change', newMode);
          });
        });
      };
      window.electron.ipcRenderer.on('pre-mode-changed', preModeHandler);
      return () => {
        try {
          window.electron.ipcRenderer.removeListener('pre-mode-changed', preModeHandler);
        } catch {}
      };
    }
    return () => {};
  }, [isElectron]);

  // 监听模式实际变化
  useEffect(() => {
    if (isElectron) {
      const modeChangedHandler = (_event: any, newMode: any) => {
        setMode(newMode);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.electron.ipcRenderer.send('mode-change-rendered');
          });
        });
      };
      window.electron.ipcRenderer.on('mode-changed', modeChangedHandler);
      return () => {
        try {
          window.electron.ipcRenderer.removeListener('mode-changed', modeChangedHandler);
        } catch {}
      };
    }
    return () => {};
  }, [isElectron]);

  return { mode, isElectron, isFullscreen };
}

