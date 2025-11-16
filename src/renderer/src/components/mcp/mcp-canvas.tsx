/**
 * MCP Canvas 主组件
 * 浮动在 Live2D 人物上方的可复用画布，展示 MCP 工具返回的内容
 */

import { memo, useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CloseButton } from '@/components/ui/close-button';
import { useAppStore, useMCPStore } from '@/store';
import { useMCPPosition } from '@/hooks/mcp/use-mcp-position';
import { useMCPResize } from '@/hooks/mcp/use-mcp-resize';
import { MCPCanvasContent } from './mcp-canvas-content';
import { MCPCanvasControls } from './mcp-canvas-controls';

interface MCPCanvasProps {
  isPet: boolean;
  vpDebug?: boolean;
}

/**
 * MCP Canvas 主组件
 * 
 * 功能：
 * - 监听 MCP 状态，自动显示/隐藏
 * - 定位在 Live2D 胸口位置
 * - 渲染不同类型的内容（图片/视频/地图）
 * - vpDebug 模式下支持拖拽调整（按住 Shift 键激活）
 * - 只在 Live2D 显示且广告不播放时可见
 * 
 * vpDebug 模式按键控制：
 * - 按住 Shift 键：激活 MCP Canvas 拖拽模式，显示控制手柄
 * - 释放 Shift 键：MCP Canvas 鼠标事件穿透，可操作底层画布
 */
export const MCPCanvas = memo(({ vpDebug = false }: MCPCanvasProps) => {
  // ✅ 精确订阅需要的状态
  const { hideMCPContent } = useMCPStore();
  const isVisible = useAppStore((s) => s.mcp?.isVisible ?? false);
  const contentType = useAppStore((s) => s.mcp?.contentType);
  const contentData = useAppStore((s) => s.mcp?.contentData);
  const position = useAppStore((s) => s.mcp?.position ?? { x: 0, y: 0 });
  const size = useAppStore((s) => s.mcp?.size ?? { width: 400, height: 300 });
  
  // 获取 Live2D 和广告状态
  const modelInfo = useAppStore((s) => s.media?.live2d?.modelInfo);
  const showAdvertisements = useAppStore((s) => s.media?.showAdvertisements ?? false);
  
  // Live2D 容器引用（用于定位）
  const live2dContainerRef = useRef<HTMLDivElement>(null);
  
  // 🎮 vpDebug 模式下的按键控制（Shift 键）
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // 监听 Shift 键状态（只在 vpDebug 模式下）
  useEffect(() => {
    if (!vpDebug) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
        console.log('🎨 MCP Canvas: Shift 键按下，MCP 拖拽模式激活');
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && isShiftPressed) {
        setIsShiftPressed(false);
        console.log('🎨 MCP Canvas: Shift 键释放，MCP 拖拽模式关闭');
      }
    };
    
    // 全局监听
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [vpDebug, isShiftPressed]);
  
  // 计算是否应该渲染
  const shouldRender = useMemo(() => {
    // vpDebug 模式下，即使没有内容也显示画布（用于调试定位）
    if (vpDebug && modelInfo !== null && modelInfo !== undefined && !showAdvertisements) {
      return true;
    }
    
    // 正常模式：只有有内容时才显示
    return (
      isVisible &&
      !showAdvertisements &&  // 广告不播放时才显示
      modelInfo !== null &&
      modelInfo !== undefined  // Live2D 已加载
    );
  }, [vpDebug, isVisible, showAdvertisements, modelInfo]);

  // 计算位置
  const calculatedPosition = useMCPPosition({
    containerRef: live2dContainerRef,
    enabled: shouldRender,
  });

  // 拖拽调整功能
  const { startDrag } = useMCPResize({ vpDebug });

  // 处理拖拽开始
  const handleStartDrag = useCallback(
    (e: React.MouseEvent, handle: 'tl' | 'tr' | 'bl' | 'br' | 'move') => {
      startDrag(e, handle, position, size);
    },
    [startDrag, position, size]
  );

  // 关闭按钮点击
  const handleClose = useCallback(() => {
    hideMCPContent();
  }, [hideMCPContent]);

  // 🛡️ 阻止鼠标事件传播到底层（关键修复！）
  // 只有当 Shift 按下且 pointerEvents="auto" 时才阻止
  const handleBoxMouseDown = useCallback((e: React.MouseEvent) => {
    if (vpDebug && isShiftPressed) {
      e.stopPropagation();  // 阻止冒泡到父元素
      e.preventDefault();   // 阻止默认行为（如文本选择）
      console.log('🎨 MCP Canvas Box: 阻止事件冒泡和默认行为');
    }
  }, [vpDebug, isShiftPressed]);

  // 🛡️ 不阻止 mousemove 事件，让拖拽逻辑正常工作
  const handleBoxMouseMove = useCallback(() => {
    // 不阻止 mousemove 事件，让拖拽过程中的鼠标移动能正常处理
    // 只在 mousedown 时阻止，避免干扰拖拽过程中的 mousemove
  }, []);

  // 如果不应该渲染，返回隐藏的容器引用占位符
  if (!shouldRender) {
    return (
      <Box
        ref={live2dContainerRef}
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        pointerEvents="none"
        display="none"
      />
    );
  }

  // 使用计算的位置或存储的位置
  const finalLeft = position.x !== 0 ? position.x : calculatedPosition.left;
  const finalTop = position.y !== 0 ? position.y : calculatedPosition.top;

  return (
    <>
      {/* Live2D 容器引用（用于定位计算） */}
      <Box
        ref={live2dContainerRef}
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        pointerEvents="none"
      />

      {/* MCP Canvas 画布 */}
      <Box
        position="absolute"
        left={`${finalLeft}px`}
        top={`${finalTop}px`}
        width={`${size.width}px`}
        height={`${size.height}px`}
        bg={vpDebug && !isVisible ? "rgba(173, 216, 230, 0.3)" : "rgba(255, 255, 255, 0.95)"}  // vpDebug 无内容时半透明蓝色
        borderRadius="12px"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
        backdropFilter="blur(10px)"
        overflow="hidden"
        zIndex={1500}  // 必须高于 ViewportDebugHandles 的透明拖拽层 (1000)
        opacity={vpDebug || isVisible ? 1 : 0}  // vpDebug 模式下始终显示
        transform={vpDebug || isVisible ? 'scale(1)' : 'scale(0.95)'}
        transition="all 0.3s ease"
        // 🎮 pointerEvents 逻辑：
        // - 有内容显示时（isVisible）：始终可交互（正常和 vpDebug 模式）
        // - vpDebug 调试模式（无内容）：只有按住 Shift 键时可交互
        // - 其他情况：不可交互
        pointerEvents={
          isVisible 
            ? "auto"  // 有内容：始终可交互（关闭按钮、视频控制等）
            : (vpDebug && isShiftPressed ? "auto" : "none")  // 无内容：vpDebug 模式下按 Shift 可拖拽
        }
        // 🛡️ 阻止事件冒泡（按住 Shift 时）
        onMouseDown={handleBoxMouseDown}
        onMouseMove={handleBoxMouseMove}
        // 🖱️ 使用 style 确保光标样式优先级最高
        style={{
          cursor: vpDebug && isShiftPressed 
            ? "move"  // Shift 按下：移动光标
            : isVisible 
              ? "default"  // 有内容：默认光标
              : "auto",  // 穿透模式：让底层光标显示
        }}
        _hover={{
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
        }}
        // vpDebug 模式下，按住 Shift 键时显示边框提示
        outline={vpDebug && isShiftPressed ? "3px solid rgba(59, 130, 246, 0.8)" : "none"}
        outlineOffset="2px"
      >
          {/* vpDebug 模式下的调整控件（只有按住 Shift 键时显示）*/}
          {vpDebug && isShiftPressed && <MCPCanvasControls onStartDrag={handleStartDrag} />}

          {/* 关闭按钮 */}
          <CloseButton
            size="sm"
            position="absolute"
            top={vpDebug ? '35px' : '8px'}  // vpDebug 模式下避开拖拽区域
            right="8px"
            zIndex={101}
            onClick={handleClose}
            colorScheme="gray"
            _hover={{
              bg: 'rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* 内容区域 */}
          <Box
            width="100%"
            height="100%"
            pt={vpDebug ? '30px' : 0}  // vpDebug 模式下为拖拽区域留空间
          >
            {vpDebug && !isVisible ? (
              // vpDebug 模式下的占位内容
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="blue.600"
              >
                <Text fontSize="lg" fontWeight="bold">🔧 MCP Canvas 调试模式</Text>
                <Text fontSize="sm" mt={2} fontWeight="bold" color={isShiftPressed ? "blue.700" : "blue.500"}>
                  {isShiftPressed ? "✅ 拖拽模式已激活" : "⌨️ 按住 Shift 键进入拖拽模式"}
                </Text>
                <Text fontSize="xs" mt={2} color="gray.600">
                  拖拽移动 | 拉伸四角调整大小
                </Text>
                <Text fontSize="xs" mt={4} color="gray.500">
                  在控制台运行测试命令显示内容
                </Text>
              </Box>
            ) : (
              <MCPCanvasContent
                contentType={contentType}
                contentData={contentData}
              />
            )}
          </Box>

          {/* 底部描述文字（如果有） */}
          {contentData?.description && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="rgba(0, 0, 0, 0.7)"
              color="white"
              p={2}
              fontSize="sm"
            >
              {contentData.description}
            </Box>
          )}
        </Box>
    </>
  );
});

MCPCanvas.displayName = 'MCPCanvas';

