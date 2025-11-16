import { Box } from '@chakra-ui/react';
import Canvas from '../canvas/canvas';
import TitleBar from '../electron/title-bar';
import ControlPanel from '../../pages/control-panel';
import { AdCarousel } from '../advertisement/ad-carousel';
import { ViewportContainer } from '../viewport/viewport-container';
import { ViewportDebugHandles } from '../viewport/viewport-debug-handles';
import { Viewport } from '../../hooks/utils/use-viewport';
import { DragMode } from '../../hooks/utils/use-viewport-drag';

interface WindowModeProps {
  isElectron: boolean; // 是否是Electron模式
  isFullscreen: boolean; // 是否是全屏模式
  mainContainerHeight: string; // 主容器高度
  viewport: Viewport; // 视口
  vpDebug: boolean; // 是否是调试模式
  startDrag: (mode: DragMode) => (e: React.MouseEvent) => void; // 开始拖拽
  // 控制面板
  isControlPanelOpen: boolean; // 是否是控制面板打开
  closeControlPanel: () => void; // 关闭控制面板
  // 媒体状态
  showAdvertisements: boolean; // 是否显示广告
  isAudioEnabled: boolean; // 是否是音频模式
  isVADEnabled: boolean; // 是否是VAD模式
}

/**
 * Window 模式组件
 */
export function WindowMode({
  isElectron,
  isFullscreen,
  mainContainerHeight,
  viewport,
  vpDebug,
  startDrag,
  isControlPanelOpen,
  closeControlPanel,
  showAdvertisements,
  isAudioEnabled,
  isVADEnabled,
}: WindowModeProps) {
  return (
    <>
      {/* 只在非全屏时显示标题栏 */}
      {isElectron && !isFullscreen && <TitleBar />}
      
      <Box
        width="100vw"
        height={mainContainerHeight}
        bg="gray.900"
        color="white"
        overflow="hidden"
        position="relative"
      >
        {/* 统一视口容器 */}
        <ViewportContainer viewport={viewport} vpDebug={vpDebug}>
          {/* 主画布 - 仅在无广告时渲染 */}
          {!showAdvertisements && <Canvas />}

          {/* 广告轮播系统 */}
          <AdCarousel
            isVisible={showAdvertisements}
            enableAudioWithVAD={isVADEnabled}
            defaultAudioEnabled={isAudioEnabled}
            onRequestAdvertisements={() => {
              console.log('请求更多广告数据...');
            }}
          />

          {/* 调试手柄 */}
          {vpDebug && <ViewportDebugHandles startDrag={startDrag} />}
        </ViewportContainer>

        {/* 控制面板 - 限定在视口内 */}
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
  );
}

