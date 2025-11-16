import { Box } from '@chakra-ui/react';
import { Live2D } from '../canvas/live2d';
import { MCPCanvas } from '../mcp/mcp-canvas';
import { InputSubtitle } from '../electron/input-subtitle';
import { AdCarousel } from '../advertisement/ad-carousel';
import { ViewportContainer } from '../viewport/viewport-container';
import { ViewportDebugHandles } from '../viewport/viewport-debug-handles';
import { Viewport } from '../../hooks/utils/use-viewport';
import { DragMode } from '../../hooks/utils/use-viewport-drag';

interface PetModeProps {
  mainContainerHeight: string;
  viewport: Viewport;
  vpDebug: boolean;
  startDrag: (mode: DragMode) => (e: React.MouseEvent) => void;
  // 媒体状态
  showAdvertisements: boolean;
  isAudioEnabled: boolean;
  isVADEnabled: boolean;
}

/**
 * Pet 模式组件
 */
export function PetMode({
  mainContainerHeight,
  viewport,
  vpDebug,
  startDrag,
  showAdvertisements,
  isAudioEnabled,
  isVADEnabled,
}: PetModeProps) {
  return (
    <>
      <Box
        width="100vw"
        height={mainContainerHeight}
        position="relative"
        overflow="hidden"
        bg="transparent"
      >
        {/* 统一视口容器 */}
        <ViewportContainer viewport={viewport} vpDebug={vpDebug}>
          {/* Live2D */}
          {!showAdvertisements && <Live2D isPet={true} />}

          {/* MCP Canvas: 展示 MCP 工具返回的内容 */}
          {!showAdvertisements && <MCPCanvas isPet={true} vpDebug={vpDebug} />}

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
      </Box>

      {/* 输入字幕 */}
      {!showAdvertisements && <InputSubtitle isPet={true} />}
    </>
  );
}

