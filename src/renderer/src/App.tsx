import { useEffect } from 'react';
import { useAppStore } from './store';
import { AppProviders } from './providers';
import { useGlobalShortcuts } from './hooks/utils/use-keyboard-shortcuts';
import { useAdvertisementAudioConfig } from './hooks/sidebar/setting/use-advertisement-audio-settings';
import { useViewport } from './hooks/utils/use-viewport';
import { useViewportDrag } from './hooks/utils/use-viewport-drag';
import { useAppMode } from './hooks/electron/use-app-mode';
import { useControlPanel } from './hooks/utils/use-control-panel';
import { WindowMode } from './components/modes/window-mode';
import { PetMode } from './components/modes/pet-mode';
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

function AppContent(): JSX.Element {
  // Hooks - 状态管理
  const { mode, isElectron, isFullscreen } = useAppMode(); // 获取应用模式 分别是mode(窗口模式或宠物模式) isElectron(是否是Electron模式) isFullscreen(是否是全屏模式)
  const { viewport, vpDebug, applyViewport } = useViewport(); // 获取视口状态 分别是viewport(视口状态) vpDebug(是否是调试模式) applyViewport(应用视口状态)
  const { startDrag } = useViewportDrag(viewport, applyViewport); // 获取拖拽状态 分别是startDrag(开始拖拽)
  const { isOpen: isControlPanelOpen, open: openControlPanel, close: closeControlPanel } = useControlPanel(); // 获取控制面板状态 分别是isControlPanelOpen(是否是控制面板打开) openControlPanel(打开控制面板) closeControlPanel(关闭控制面板)

  // 媒体状态 - ✅ 精确订阅
  const showAdvertisements = useAppStore((s) => s.media.showAdvertisements); // 获取媒体状态 分别是showAdvertisements(是否显示广告)
  const { isAudioEnabled, isVADEnabled } = useAdvertisementAudioConfig(); // 获取广告音频状态 分别是isAudioEnabled(是否是音频模式) isVADEnabled(是否是VAD模式)

  // 全局快捷键
  useGlobalShortcuts(openControlPanel, closeControlPanel, isControlPanelOpen); // 使用全局快捷键 分别是openControlPanel(打开控制面板) closeControlPanel(关闭控制面板) isControlPanelOpen(是否是控制面板打开)

  // ✅ 检测URL参数，支持扫码直接打开控制面板
  useEffect(() => {
    // 检查URL路径或参数
    const urlPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const openPanel = urlParams.get('panel') || urlParams.get('control');
    
    // 如果URL包含 /control-panel 或参数 ?panel=true，自动打开控制面板
    if (urlPath.includes('/control-panel') || openPanel === 'true' || openPanel === '1') {
      console.log('🔓 检测到扫码访问，自动打开控制面板');
      openControlPanel();
    }
  }, [openControlPanel]);

  // 视口高度 CSS 变量设置
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 计算主容器高度
  const getMainContainerHeight = () => {
    if (isFullscreen) return '100vh';
    return isElectron ? 'calc(100vh - 30px)' : '100vh';
  };

  const mainContainerHeight = getMainContainerHeight();

  return (
    <>
      {mode === 'window' ? (
        <WindowMode
          isElectron={isElectron}
          isFullscreen={isFullscreen}
          mainContainerHeight={mainContainerHeight}
          viewport={viewport}
          vpDebug={vpDebug}
          startDrag={startDrag}
          isControlPanelOpen={isControlPanelOpen}
          closeControlPanel={closeControlPanel}
          showAdvertisements={showAdvertisements}
          isAudioEnabled={isAudioEnabled}
          isVADEnabled={isVADEnabled}
        />
      ) : (
        <PetMode
          mainContainerHeight={mainContainerHeight}
          viewport={viewport}
          vpDebug={vpDebug}
          startDrag={startDrag}
          showAdvertisements={showAdvertisements}
          isAudioEnabled={isAudioEnabled}
          isVADEnabled={isVADEnabled}
        />
      )}
    </>
  );
}

function App(): JSX.Element {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
