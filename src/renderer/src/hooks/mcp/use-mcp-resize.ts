/**
 * MCP Canvas 拖拽调整 Hook
 * 仅在 vpDebug 模式下启用，支持拖拽移动和尺寸调整
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';

interface ResizeOptions {
  vpDebug: boolean;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'move';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  handle: ResizeHandle | null;
}

/**
 * MCP Canvas 拖拽调整功能
 */
export function useMCPResize({ vpDebug }: ResizeOptions) {
  const updateMCPPosition = useAppStore((s) => s.updateMCPPosition);
  const updateMCPSize = useAppStore((s) => s.updateMCPSize);
  
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    handle: null,
  });

  // 🔧 使用 ref 保存最新的 update 函数，避免事件监听器依赖问题
  const updateFnsRef = useRef({ updateMCPPosition, updateMCPSize });
  
  useEffect(() => {
    updateFnsRef.current = { updateMCPPosition, updateMCPSize };
  }, [updateMCPPosition, updateMCPSize]);

  /**
   * 处理鼠标移动（使用稳定的引用）
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - dragState.current.startX;
    const deltaY = e.clientY - dragState.current.startY;
    const { handle, startPosition, startSize } = dragState.current;

    // 从 ref 获取最新的更新函数
    const { updateMCPPosition: updatePos, updateMCPSize: updateSize } = updateFnsRef.current;

    if (handle === 'move') {
      // 移动画布
      updatePos(
        startPosition.x + deltaX,
        startPosition.y + deltaY
      );
    } else {
      // 调整尺寸
      const MIN_WIDTH = 200;
      const MIN_HEIGHT = 150;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPosition.x;
      let newY = startPosition.y;

      switch (handle) {
        case 'tl': // 左上角
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height - deltaY;
          // 只有当尺寸改变时，才调整位置
          if (newWidth >= MIN_WIDTH) {
            newX = startPosition.x + deltaX;
          } else {
            // 达到最小宽度，位置停止移动
            newWidth = MIN_WIDTH;
          }
          if (newHeight >= MIN_HEIGHT) {
            newY = startPosition.y + deltaY;
          } else {
            // 达到最小高度，位置停止移动
            newHeight = MIN_HEIGHT;
          }
          break;
        case 'tr': // 右上角
          newWidth = Math.max(startSize.width + deltaX, MIN_WIDTH);
          if (startSize.height - deltaY >= MIN_HEIGHT) {
            newHeight = startSize.height - deltaY;
            newY = startPosition.y + deltaY;
          } else {
            newHeight = MIN_HEIGHT;
          }
          break;
        case 'bl': // 左下角
          newHeight = Math.max(startSize.height + deltaY, MIN_HEIGHT);
          if (startSize.width - deltaX >= MIN_WIDTH) {
            newWidth = startSize.width - deltaX;
            newX = startPosition.x + deltaX;
          } else {
            newWidth = MIN_WIDTH;
          }
          break;
        case 'br': // 右下角
          newWidth = Math.max(startSize.width + deltaX, MIN_WIDTH);
          newHeight = Math.max(startSize.height + deltaY, MIN_HEIGHT);
          break;
      }

      // 更新尺寸
      updateSize(newWidth, newHeight);

      // 更新位置（左上角和右上角、左下角需要调整位置）
      if (handle === 'tl' || handle === 'tr' || handle === 'bl') {
        updatePos(newX, newY);
      }
      // br（右下角）不需要调整位置
    }
  }, []); // 空依赖，使用 ref 保持最新函数引用

  /**
   * 结束拖拽（使用稳定的引用）
   */
  const handleMouseUp = useCallback(() => {
    if (dragState.current.isDragging) {
      console.log('🎨 MCP Resize: 结束拖拽');
      dragState.current.isDragging = false;
    }

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]); // 只依赖 handleMouseMove（现在是稳定的）

  /**
   * 开始拖拽
   */
  const startDrag = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle, currentPosition: { x: number; y: number }, currentSize: { width: number; height: number }) => {
      if (!vpDebug) return;

      e.preventDefault();
      e.stopPropagation();

      dragState.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosition: { ...currentPosition },
        startSize: { ...currentSize },
        handle,
      };

      console.log('🎨 MCP Resize: 开始拖拽', { handle, currentPosition, currentSize });

      // 添加全局事件监听
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [vpDebug, handleMouseMove, handleMouseUp]
  );

  // 🧹 组件卸载时清理事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    startDrag,
  };
}

