/**
 * MCP Canvas 控制组件
 * vpDebug 模式下显示的拖拽调整手柄
 */

import { memo } from 'react';
import { Box } from '@chakra-ui/react';

interface MCPCanvasControlsProps {
  onStartDrag: (e: React.MouseEvent, handle: 'tl' | 'tr' | 'bl' | 'br' | 'move') => void;
}

/**
 * 调整手柄样式
 */
const handleStyle = {
  position: 'absolute' as const,
  width: '12px',
  height: '12px',
  bg: 'blue.500',
  border: '2px solid white',
  borderRadius: '50%',
  cursor: 'pointer',
  zIndex: 1600,  // 高于父容器 (1500) 和 ViewportDebugHandles (1000)
  _hover: {
    bg: 'blue.600',
    transform: 'scale(1.2)',
  },
  transition: 'all 0.2s',
};

/**
 * MCP Canvas 控制组件
 */
export const MCPCanvasControls = memo(({ onStartDrag }: MCPCanvasControlsProps) => {
  return (
    <>
      {/* 移动手柄（标题栏区域） */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="30px"
        cursor="move"
        bg="rgba(0, 0, 255, 0.1)"
        borderBottom="1px dashed blue"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onMouseDown={(e) => onStartDrag(e, 'move')}
        _hover={{
          bg: 'rgba(0, 0, 255, 0.2)',
        }}
      >
        <Box fontSize="xs" color="blue.600" fontWeight="bold">
          ⬍ 拖拽移动 ⬍
        </Box>
      </Box>

      {/* 四角调整手柄 */}
      {/* 左上角 */}
      <Box
        {...handleStyle}
        top="-6px"
        left="-6px"
        cursor="nwse-resize"
        onMouseDown={(e) => onStartDrag(e, 'tl')}
      />

      {/* 右上角 */}
      <Box
        {...handleStyle}
        top="-6px"
        right="-6px"
        cursor="nesw-resize"
        onMouseDown={(e) => onStartDrag(e, 'tr')}
      />

      {/* 左下角 */}
      <Box
        {...handleStyle}
        bottom="-6px"
        left="-6px"
        cursor="nesw-resize"
        onMouseDown={(e) => onStartDrag(e, 'bl')}
      />

      {/* 右下角 */}
      <Box
        {...handleStyle}
        bottom="-6px"
        right="-6px"
        cursor="nwse-resize"
        onMouseDown={(e) => onStartDrag(e, 'br')}
      />

      {/* 边框指示器 */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        border="2px dashed blue"
        borderRadius="12px"
        pointerEvents="none"
        opacity={0.5}
      />
    </>
  );
});

MCPCanvasControls.displayName = 'MCPCanvasControls';

