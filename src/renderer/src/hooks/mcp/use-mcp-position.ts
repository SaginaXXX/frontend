/**
 * MCP Canvas 定位 Hook
 * 计算 MCP Canvas 在 Live2D 人物胸口的位置
 */

import { useEffect, useState, RefObject } from 'react';
import { useAppStore } from '@/store';

interface MCPPositionOptions {
  containerRef: RefObject<HTMLDivElement>;
  enabled: boolean; // 只有在显示时才计算
}

interface CalculatedPosition {
  left: number;
  top: number;
}

/**
 * 计算 MCP Canvas 的位置
 * 定位在 Live2D 容器的胸口位置（容器高度的 35% 处，水平居中偏右）
 */
export function useMCPPosition({ containerRef, enabled }: MCPPositionOptions): CalculatedPosition {
  const storedPosition = useAppStore((s) => s.mcp?.position ?? { x: 0, y: 0 });
  const [calculatedPosition, setCalculatedPosition] = useState<CalculatedPosition>({
    left: 0,
    top: 0,
  });

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return undefined;
    }

    const calculatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      
      // 如果 storedPosition 有有效值（vpDebug 模式下调整过），使用存储的位置
      if (storedPosition.x !== 0 || storedPosition.y !== 0) {
        setCalculatedPosition({
          left: storedPosition.x,
          top: storedPosition.y,
        });
        return;
      }

      // 否则计算默认位置：胸口位置
      // 水平：容器宽度的 55% 处（居中偏右）
      // 垂直：容器高度的 35% 处（胸口位置）
      const defaultLeft = containerRect.width * 0.55;
      const defaultTop = containerRect.height * 0.35;

      setCalculatedPosition({
        left: defaultLeft,
        top: defaultTop,
      });

      console.log('🎨 MCP Position: 计算位置', {
        containerSize: {
          width: containerRect.width,
          height: containerRect.height,
        },
        calculated: {
          left: defaultLeft,
          top: defaultTop,
        },
      });
    };

    // 初始计算
    calculatePosition();

    // 监听窗口大小变化
    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);

    // 监听 Live2D 容器大小变化（使用 ResizeObserver）
    const resizeObserver = new ResizeObserver(() => {
      calculatePosition();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [enabled, containerRef, storedPosition.x, storedPosition.y]);

  return calculatedPosition;
}

