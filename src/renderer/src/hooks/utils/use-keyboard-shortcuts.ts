import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, enabled: boolean = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // 创建快捷键标识符
    const modifiers: Array<'ctrl' | 'alt' | 'shift' | 'meta'> = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');
    
    const key = event.key.toLowerCase();
    const shortcutKey = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
    
    // 添加调试信息
    console.log(`Key pressed: ${event.key}, shortcutKey: ${shortcutKey}, available shortcuts:`, Object.keys(shortcuts));
    
    // 检查是否有对应的快捷键处理函数
    const handler = shortcuts[shortcutKey];
    if (handler) {
      console.log(`Executing handler for: ${shortcutKey}`);
      event.preventDefault();
      event.stopPropagation();
      handler();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

// 专门用于控制面板的快捷键hook
export const useControlPanelShortcuts = (
  onOpenControlPanel: () => void,
  onCloseControlPanel: () => void,
  isControlPanelOpen: boolean
) => {
  const shortcuts = {
    // Ctrl + Space 打开控制面板
    'ctrl+ ': onOpenControlPanel,
    // Ctrl + M 打开控制面板
    'ctrl+m': onOpenControlPanel,
    // Escape 关闭控制面板
    'escape': isControlPanelOpen ? onCloseControlPanel : () => {},
  };

  useKeyboardShortcuts(shortcuts, true);
};

// 全局快捷键hook，包含全屏功能
export const useGlobalShortcuts = (
  onOpenControlPanel: () => void,
  onCloseControlPanel: () => void,
  isControlPanelOpen: boolean
) => {
  const toggleFullscreen = useCallback(() => {
    console.log('Toggle fullscreen requested');

    const isElectronEnv = typeof window !== 'undefined' && (window as any).api;

    if (isElectronEnv) {
      try {
        console.log('Calling Electron toggleFullscreen API');
        (window as any).api.toggleFullscreen();
        return;
      } catch (error) {
        console.error('Error calling Electron toggleFullscreen:', error);
        // fall through to DOM fullscreen
      }
    }

    // 浏览器环境：使用 DOM Fullscreen API
    const doc: any = document;
    const el: any = document.documentElement;
    const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    try {
      if (!isFullscreen) {
        const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (request) {
          request.call(el, { navigationUI: 'hide' }).catch?.(() => {});
        }
      } else {
        const exit = document.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(document);
        }
      }
    } catch (err) {
      console.error('DOM fullscreen toggle failed:', err);
    }
  }, []);

  const shortcuts: KeyboardShortcuts = {
    // Ctrl + Space 打开控制面板
    'ctrl+ ': onOpenControlPanel,
    // Ctrl + M 打开控制面板
    'ctrl+m': onOpenControlPanel,
    // F11 切换全屏
    'f11': toggleFullscreen,
    // Ctrl + G 也切换全屏（Linux/Windows/浏览器通用）
    'ctrl+g': toggleFullscreen,
  };

  // 仅在控制面板已打开时才拦截 Escape，避免阻断浏览器 Esc 退出全屏
  if (isControlPanelOpen) {
    shortcuts['escape'] = onCloseControlPanel;
  }

  useKeyboardShortcuts(shortcuts, true);
}; 