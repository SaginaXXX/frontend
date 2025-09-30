// import { StrictMode } from 'react';
import { Box } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Canvas from './components/canvas/canvas';

import { Live2D } from './components/canvas/live2d';
import TitleBar from './components/electron/title-bar';
import { InputSubtitle } from './components/electron/input-subtitle';
import ControlPanel from './pages/control-panel';
import { useGlobalShortcuts } from './hooks/utils/use-keyboard-shortcuts';
import VideoPlayer from './components/laundry/video-player';
import { useMediaStore } from './store';
import { AdCarousel } from './components/advertisement/ad-carousel';
import { AppProviders } from './providers';
import { useAdvertisementAudioConfig } from './hooks/sidebar/setting/use-advertisement-audio-settings';
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

function AppContent(): JSX.Element {
  // 模式：window、pet
  const [mode, setMode] = useState('window');
  // 控制面板是否打开
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  // 是否全屏
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 是否是Electron环境
  const isElectron = window.api !== undefined;
  // 当前视频
  const { currentVideo, videoTitle, setCurrentVideo } = useMediaStore();
  // 是否显示广告
  const { showAdvertisements } = useMediaStore();
  // 广告音频设置
  const { isAudioEnabled, isVADEnabled } = useAdvertisementAudioConfig();

  // 控制面板相关函数
  const openControlPanel = () => setIsControlPanelOpen(true);
  const closeControlPanel = () => setIsControlPanelOpen(false);

  // 注册全局快捷键（包括F11全屏）
  useGlobalShortcuts(openControlPanel, closeControlPanel, isControlPanelOpen);

  // 监听全屏状态变化
  useEffect(() => {
    if (isElectron && window.api?.onFullscreenChange) {
      const cleanup = window.api.onFullscreenChange((fullscreen: boolean) => {
        setIsFullscreen(fullscreen);
      });
      return cleanup;
    }
  }, [isElectron]);

  // 监听模式变化
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
        try { window.electron.ipcRenderer.removeListener('pre-mode-changed', preModeHandler); } catch {}
      };
    }
    return () => {};
  }, [isElectron]);

  // 监听模式变化
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
        try { window.electron.ipcRenderer.removeListener('mode-changed', modeChangedHandler); } catch {}
      };
    }
    return () => {};
  }, [isElectron]);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 计算主容器高度 - 全屏时使用100vh，否则考虑标题栏
  const getMainContainerHeight = () => {
    if (isFullscreen) {
      return '100vh'; // 全屏模式使用整个视口高度
    }
    return isElectron ? 'calc(100vh - 30px)' : '100vh';
  };

  // === 统一裁剪窗口（Viewport）参数：从 URL 读取，缺省为全屏 ===
  const getNum = (k: string, d: number) => {
    const v = new URLSearchParams(location.search).get(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : d;
  };
  const getFlag = (k: string) => (new URLSearchParams(location.search).get(k) ?? '') === '1';
  const [viewport, setViewport] = useState(() => ({
    x: Math.round(getNum('cx', 0)),
    y: Math.round(getNum('cy', 0)),
    w: Math.round(getNum('cw', window.innerWidth)),
    h: Math.round(getNum('ch', window.innerHeight)),
  }));
  const [vpDebug, setVpDebug] = useState(getFlag('vpdebug'));
  // 拖拽/缩放状态
  type DragMode = null | 'move' | 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se';
  const [drag, setDrag] = useState<{
    mode: DragMode;
    startX: number;
    startY: number;
    startV: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const minSize = 50;

  const applyViewport = (nv: {x:number;y:number;w:number;h:number}) => {
    setViewport(nv);
    // 同步到 URL（不跳转）
    try {
      const sp = new URLSearchParams(location.search);
      sp.set('cx', String(nv.x));
      sp.set('cy', String(nv.y));
      sp.set('cw', String(nv.w));
      sp.set('ch', String(nv.h));
      if (vpDebug) sp.set('vpdebug', '1');
      const url = `${location.pathname}?${sp.toString()}${location.hash}`;
      history.replaceState(null, '', url);
    } catch { /* noop */ }
  };
  useEffect(() => {
    // 初次挂载时打印一次（仅在调试模式）
    if (vpDebug) {
      // eslint-disable-next-line no-console
      console.log('[Viewport:init]', {
        search: location.search,
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        viewport,
      });
    }
  // 只在初次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onResize = () => {
      setViewport((v) => ({ x: v.x, y: v.y, w: Math.round(getNum('cw', window.innerWidth)), h: Math.round(getNum('ch', window.innerHeight)) }));
      // 仅在调试模式下记录
      if (vpDebug) {
        // eslint-disable-next-line no-console
        console.log('[Viewport:resize]', {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        });
      }
    };
    const onNav = () => {
      setViewport({
        x: Math.round(getNum('cx', 0)),
        y: Math.round(getNum('cy', 0)),
        w: Math.round(getNum('cw', window.innerWidth)),
        h: Math.round(getNum('ch', window.innerHeight)),
      });
      setVpDebug(getFlag('vpdebug'));
      if (vpDebug) {
        // eslint-disable-next-line no-console
        console.log('[Viewport:navigation]', {
          search: location.search,
          viewport: {
            x: Math.round(getNum('cx', 0)),
            y: Math.round(getNum('cy', 0)),
            w: Math.round(getNum('cw', window.innerWidth)),
            h: Math.round(getNum('ch', window.innerHeight)),
          },
        });
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, []);
  useEffect(() => {
    // 视口变更时打印（调试时）
    if (vpDebug) {
      // eslint-disable-next-line no-console
      console.log('[Viewport:apply]', viewport);
    }
  }, [viewport, vpDebug]);

  // 拖拽事件
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      let { x, y, w, h } = drag.startV;
      switch (drag.mode) {
        case 'move':
          x = clamp(x + dx, 0, winW - w);
          y = clamp(y + dy, 0, winH - h);
          break;
        case 'e':
          w = clamp(w + dx, minSize, winW - x); break;
        case 's':
          h = clamp(h + dy, minSize, winH - y); break;
        case 'w':
          x = clamp(x + dx, 0, x + w - minSize); w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x); break;
        case 'n':
          y = clamp(y + dy, 0, y + h - minSize); h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y); break;
        case 'se':
          w = clamp(w + dx, minSize, winW - x); h = clamp(h + dy, minSize, winH - y); break;
        case 'ne':
          y = clamp(y + dy, 0, y + h - minSize); h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y); w = clamp(w + dx, minSize, winW - x); break;
        case 'sw':
          x = clamp(x + dx, 0, x + w - minSize); w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x); h = clamp(h + dy, minSize, winH - y); break;
        case 'nw':
          x = clamp(x + dx, 0, x + w - minSize); y = clamp(y + dy, 0, y + h - minSize);
          w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x);
          h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y);
          break;
        default:
          break;
      }
      applyViewport({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    };
    const onUp = () => setDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, vpDebug]);

  const startDrag = (mode: DragMode) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDrag({ mode, startX: e.clientX, startY: e.clientY, startV: viewport });
  };

  return (
    <>
      {mode === 'window' ? (
        <>
          {/* 只在非全屏时显示标题栏 */}
          {isElectron && !isFullscreen && <TitleBar />}
          <Box
            width="100vw"
            height={getMainContainerHeight()}
            bg="gray.900"
            color="white"
            overflow="hidden"
            position="relative"
          >
            {/* 统一裁剪窗口：应用主体（Live2D/Canvas/广告/视频）都渲染在这里 */}
            <Box
              id="viewport"
              position="absolute"
              left={`${viewport.x}px`}
              top={`${viewport.y}px`}
              width={`${viewport.w}px`}
              height={`${viewport.h}px`}
              overflow="hidden"
              bg="transparent"
              border={vpDebug ? '2px solid #0ff' : 'none'}
            >
              {/* 仅在无广告且无教程视频时渲染主画布（Live2D/字幕等） */}
              {!showAdvertisements && !currentVideo && <Canvas />}

              {/* 洗衣店视频播放器（置于视口内） */}
              {currentVideo && (
                <VideoPlayer
                  src={currentVideo}
                  title={videoTitle}
                  autoPlay={true}
                  autoClose={true}
                  onClose={() => setCurrentVideo(null)}
                  onEnded={() => {
                    console.log('视频播放完成');
                  }}
                />
              )}

              {/* 广告轮播系统（置于视口内） */}
              <AdCarousel 
                isVisible={showAdvertisements}
                enableAudioWithVAD={isVADEnabled}
                defaultAudioEnabled={isAudioEnabled}
                onRequestAdvertisements={() => {
                  console.log('请求更多广告数据...');
                }}
              />
              {/* 调试可拖动覆盖层（位于内容之上，避免被视频遮挡） */}
              {vpDebug && (
                <Box position="absolute" left={0} top={0} right={0} bottom={0} cursor="move" bg="transparent" zIndex={1000} onMouseDown={startDrag('move')} />
              )}
              {/* 拖拽/缩放手柄：只在调试模式显示，位于最上层 */}
              {vpDebug && (
                <>
                  <Box position="absolute" left="0" top="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nwse-resize" onMouseDown={startDrag('nw')} />
                  <Box position="absolute" right="0" top="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nesw-resize" onMouseDown={startDrag('ne')} />
                  <Box position="absolute" left="0" bottom="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nesw-resize" onMouseDown={startDrag('sw')} />
                  <Box position="absolute" right="0" bottom="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nwse-resize" onMouseDown={startDrag('se')} />
                  <Box position="absolute" left="0" top="50%" width="12px" height="24px" bg="#0ff" transform="translateY(-50%)" zIndex={1001} cursor="ew-resize" onMouseDown={startDrag('w')} />
                  <Box position="absolute" right="0" top="50%" width="12px" height="24px" bg="#0ff" transform="translateY(-50%)" zIndex={1001} cursor="ew-resize" onMouseDown={startDrag('e')} />
                  <Box position="absolute" top="0" left="50%" width="24px" height="12px" bg="#0ff" transform="translateX(-50%)" zIndex={1001} cursor="ns-resize" onMouseDown={startDrag('n')} />
                  <Box position="absolute" bottom="0" left="50%" width="24px" height="12px" bg="#0ff" transform="translateX(-50%)" zIndex={1001} cursor="ns-resize" onMouseDown={startDrag('s')} />
                </>
              )}
            </Box>

            {/* 控制面板：限定在视口内（裁剪模式自适应） */}
            <Box
              position="absolute"
              left={`${viewport.x}px`}
              top={`${viewport.y}px`}
              width={`${viewport.w}px`}
              height={`${viewport.h}px`}
              pointerEvents={isControlPanelOpen ? 'auto' : 'none'}
              zIndex={1002}
              overflow="hidden"
            >
              <ControlPanel 
                isOpen={isControlPanelOpen}
                onClose={closeControlPanel}
                useViewportBounds
              />
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* PET 模式：Live2D 渲染在统一视口内 */}
          <Box
            width="100vw"
            height={getMainContainerHeight()}
            position="relative"
            overflow="hidden"
            bg="transparent"
          >
            <Box
              id="viewport"
              position="absolute"
              left={`${viewport.x}px`}
              top={`${viewport.y}px`}
              width={`${viewport.w}px`}
              height={`${viewport.h}px`}
              overflow="hidden"
              border={vpDebug ? '2px solid #0ff' : 'none'}
              onMouseDown={vpDebug ? startDrag('move') : undefined}
            >
              {!showAdvertisements && !currentVideo && (
                <Live2D isPet={mode === 'pet'} />
              )}
              {/* 在 PET 模式下也在视口内播放广告 */}
              <AdCarousel 
                isVisible={showAdvertisements}
                enableAudioWithVAD={isVADEnabled}
                defaultAudioEnabled={isAudioEnabled}
                onRequestAdvertisements={() => {
                  console.log('请求更多广告数据...');
                }}
              />
              {vpDebug && (
                <Box position="absolute" left={0} top={0} right={0} bottom={0} cursor="move" bg="transparent" zIndex={1000} onMouseDown={startDrag('move')} />
              )}
              {vpDebug && (
                <>
                  <Box position="absolute" left="0" top="0" width="10px" height="10px" bg="#0ff" cursor="nwse-resize" onMouseDown={startDrag('nw')} />
                  <Box position="absolute" right="0" top="0" width="10px" height="10px" bg="#0ff" cursor="nesw-resize" onMouseDown={startDrag('ne')} />
                  <Box position="absolute" left="0" bottom="0" width="10px" height="10px" bg="#0ff" cursor="nesw-resize" onMouseDown={startDrag('sw')} />
                  <Box position="absolute" right="0" bottom="0" width="10px" height="10px" bg="#0ff" cursor="nwse-resize" onMouseDown={startDrag('se')} />
                  <Box position="absolute" left="0" top="50%" width="10px" height="20px" bg="#0ff" transform="translateY(-50%)" cursor="ew-resize" onMouseDown={startDrag('w')} />
                  <Box position="absolute" right="0" top="50%" width="10px" height="20px" bg="#0ff" transform="translateY(-50%)" cursor="ew-resize" onMouseDown={startDrag('e')} />
                  <Box position="absolute" top="0" left="50%" width="20px" height="10px" bg="#0ff" transform="translateX(-50%)" cursor="ns-resize" onMouseDown={startDrag('n')} />
                  <Box position="absolute" bottom="0" left="50%" width="20px" height="10px" bg="#0ff" transform="translateX(-50%)" cursor="ns-resize" onMouseDown={startDrag('s')} />
                </>
              )}
            </Box>
          </Box>
          {mode === 'pet' && !showAdvertisements && !currentVideo && (
            <InputSubtitle isPet={mode === 'pet'} />
          )}
        </>
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

