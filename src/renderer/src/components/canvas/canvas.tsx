import { Box } from '@chakra-ui/react';
import Background from './background';
import Subtitle from './subtitle';
import { Live2D } from './live2d';
import { MCPCanvas } from '../mcp/mcp-canvas';
import { canvasStyles } from './canvas-styles';

function Canvas(): JSX.Element {
  // 从 URL 参数获取 vpDebug 状态
  const urlParams = new URLSearchParams(window.location.search);
  const vpDebug = urlParams.get('vpdebug') === '1';

  return (
    <Background>
      <Box
        {...canvasStyles.canvas.container}
      >
        {/* Force remount Live2D when model url changes to ensure switch takes effect */}
        <Live2D isPet={false} />
        {/* MCP Canvas: 展示 MCP 工具返回的内容 */}
        <MCPCanvas isPet={false} vpDebug={vpDebug} />
        <Subtitle />
      </Box>
    </Background>
  );
}

export default Canvas;
