import { useState, useEffect } from 'react';
import { Viewport } from './use-viewport';

export type DragMode = null | 'move' | 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se';

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  startV: Viewport;
}

export interface UseViewportDragReturn {
  drag: DragState | null;
  startDrag: (mode: DragMode) => (e: React.MouseEvent) => void;
}

/**
 * 管理视口拖拽和缩放逻辑
 */
export function useViewportDrag(
  viewport: Viewport,
  applyViewport: (v: Viewport) => void
): UseViewportDragReturn {
  const [drag, setDrag] = useState<DragState | null>(null);

  const clamp = (val: number, min: number, max: number) => 
    Math.max(min, Math.min(max, val));
  
  const minSize = 50;

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
          w = clamp(w + dx, minSize, winW - x);
          break;
        case 's':
          h = clamp(h + dy, minSize, winH - y);
          break;
        case 'w':
          x = clamp(x + dx, 0, x + w - minSize);
          w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x);
          break;
        case 'n':
          y = clamp(y + dy, 0, y + h - minSize);
          h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y);
          break;
        case 'se':
          w = clamp(w + dx, minSize, winW - x);
          h = clamp(h + dy, minSize, winH - y);
          break;
        case 'ne':
          y = clamp(y + dy, 0, y + h - minSize);
          h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y);
          w = clamp(w + dx, minSize, winW - x);
          break;
        case 'sw':
          x = clamp(x + dx, 0, x + w - minSize);
          w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x);
          h = clamp(h + dy, minSize, winH - y);
          break;
        case 'nw':
          x = clamp(x + dx, 0, x + w - minSize);
          y = clamp(y + dy, 0, y + h - minSize);
          w = clamp(drag.startV.w - (x - drag.startV.x), minSize, winW - x);
          h = clamp(drag.startV.h - (y - drag.startV.y), minSize, winH - y);
          break;
        default:
          break;
      }

      applyViewport({ 
        x: Math.round(x), 
        y: Math.round(y), 
        w: Math.round(w), 
        h: Math.round(h) 
      });
    };

    const onUp = () => setDrag(null);
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, applyViewport]);

  const startDrag = (mode: DragMode) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode, startX: e.clientX, startY: e.clientY, startV: viewport });
  };

  return { drag, startDrag };
}

