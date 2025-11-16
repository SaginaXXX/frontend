import { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { DragMode } from '../../hooks/utils/use-viewport-drag';

interface ViewportDebugHandlesProps {
  startDrag: (mode: DragMode) => (e: React.MouseEvent) => void;
}

/**
 * 视口调试手柄组件 - 用于拖拽和缩放视口（仅调试模式显示）
 */
export function ViewportDebugHandles({ startDrag }: ViewportDebugHandlesProps) {
  // 🎮 监听 Shift 键状态
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
        console.log('🎨 ViewportDebugHandles: Shift 键按下，禁用拖拽层');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && isShiftPressed) {
        setIsShiftPressed(false);
        console.log('🎨 ViewportDebugHandles: Shift 键释放，启用拖拽层');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isShiftPressed]);

  return (
    <>
      {/* 透明拖动覆盖层 - 按住 Shift 时禁用 */}
      <Box
        position="absolute"
        left={0}
        top={0}
        right={0}
        bottom={0}
        cursor="move"
        bg="transparent"
        zIndex={1000}
        // 🎮 按住 Shift 时禁用，让 MCP Canvas 接收事件
        pointerEvents={isShiftPressed ? "none" : "auto"}
        onMouseDown={startDrag('move')}
      />
      
      {/* 四角手柄 */}
      <Box position="absolute" left="0" top="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nwse-resize" onMouseDown={startDrag('nw')} />
      <Box position="absolute" right="0" top="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nesw-resize" onMouseDown={startDrag('ne')} />
      <Box position="absolute" left="0" bottom="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nesw-resize" onMouseDown={startDrag('sw')} />
      <Box position="absolute" right="0" bottom="0" width="14px" height="14px" bg="#0ff" zIndex={1001} cursor="nwse-resize" onMouseDown={startDrag('se')} />
      
      {/* 边缘手柄 */}
      <Box position="absolute" left="0" top="50%" width="12px" height="24px" bg="#0ff" transform="translateY(-50%)" zIndex={1001} cursor="ew-resize" onMouseDown={startDrag('w')} />
      <Box position="absolute" right="0" top="50%" width="12px" height="24px" bg="#0ff" transform="translateY(-50%)" zIndex={1001} cursor="ew-resize" onMouseDown={startDrag('e')} />
      <Box position="absolute" top="0" left="50%" width="24px" height="12px" bg="#0ff" transform="translateX(-50%)" zIndex={1001} cursor="ns-resize" onMouseDown={startDrag('n')} />
      <Box position="absolute" bottom="0" left="50%" width="24px" height="12px" bg="#0ff" transform="translateX(-50%)" zIndex={1001} cursor="ns-resize" onMouseDown={startDrag('s')} />
    </>
  );
}

