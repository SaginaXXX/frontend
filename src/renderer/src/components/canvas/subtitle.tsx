import { Box, Text } from '@chakra-ui/react';
import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { canvasStyles } from './canvas-styles';
import { useSubtitleDisplay } from '@/hooks/canvas/use-subtitle-display';
import { useChatStore, useAppStore } from '@/store';
import { useDraggable } from '@/hooks/electron/use-draggable';

// Type definitions
interface SubtitleTextProps {
  text: string
  style?: React.CSSProperties
}

// Reusable components
const SubtitleText = memo(({ text, style }: SubtitleTextProps) => (
  <Text {...canvasStyles.subtitle.text} style={style}>
    {text}
  </Text>
));

SubtitleText.displayName = 'SubtitleText';

// Main component
const Subtitle = memo((): JSX.Element | null => {
  const { subtitleText, isLoaded } = useSubtitleDisplay();
  const { showSubtitle } = useChatStore();
  const appConfig = useAppStore((s) => s.config.appConfig);
  const { elementRef, isDragging, handleMouseDown, handleMouseEnter, handleMouseLeave } = useDraggable({
    componentId: 'canvas-subtitle',
    baseTransform: 'translate(-50%, -50%)',
  });

  // Hold Shift (or Alt) to enable dragging/interaction for subtitle; otherwise click-through to Live2D
  const [dragMode, setDragMode] = useState(false);
  const dragPressedRef = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Alt') {
        dragPressedRef.current = true;
        setDragMode(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Alt') {
        dragPressedRef.current = false;
        setDragMode(false);
      }
    };
    const onBlur = () => { dragPressedRef.current = false; setDragMode(false); };
    const onMouseUp = () => { if (!dragPressedRef.current) setDragMode(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', onBlur);
    window.addEventListener('mouseup', onMouseUp, true);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('mouseup', onMouseUp, true);
    };
  }, []);

  // ✅ 先调用所有 hooks，再做条件判断
  const bgStyle = useMemo(() => {
    const cfg = (appConfig?.subtitle ?? {}) as any;
    const enabled = cfg.enabled ?? true;
    if (!enabled) return {} as any;

    const hexToRgb = (hex: string) => {
      const clean = (hex || '#000000').replace('#', '');
      const bigint = parseInt(clean.length === 3 ? clean.split('').map((c: string) => c + c).join('') : clean, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    };

    const { r, g, b } = hexToRgb(cfg.bgColor ?? '#000000');
    const opacity = Math.max(0, Math.min(1, Number(cfg.bgOpacity ?? 0.45)));
    const px = (v: number | string | undefined, fallback: number) => (v ?? fallback);

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      paddingInline: px(cfg.paddingX, 14),
      paddingBlock: px(cfg.paddingY, 10),
      borderRadius: px(cfg.borderRadius, 14),
      boxShadow: cfg.boxShadow ?? '0 4px 20px rgba(0,0,0,0.25)',
      backdropFilter: cfg.blur ? `blur(${cfg.blur}px)` : undefined,
      maxWidth: cfg.maxWidth ?? '96%',
    } as any;
  }, [appConfig?.subtitle]);

  const textStyle = useMemo(() => {
    const c = (appConfig?.subtitle as any)?.textColor;
    return c ? ({ color: c } as React.CSSProperties) : undefined;
  }, [appConfig?.subtitle?.textColor]);

  // ✅ 所有 hooks 调用完毕后，再做条件判断
  if (!isLoaded || !subtitleText || !showSubtitle) return null;

  return (
    // 外层容器始终点穿，避免覆盖 Live2D；真正可交互的是内层背景框
    <Box {...canvasStyles.subtitle.container} style={{ pointerEvents: 'none' as any }}>
      <Box
        ref={elementRef}
        // 仅在按住 Shift/Alt 时允许交互与拖拽
        style={{
          ...bgStyle,
          pointerEvents: dragMode ? 'auto' as any : 'none',
        }}
        cursor={dragMode ? (isDragging ? 'grabbing' : 'grab') : 'default'}
        transition={isDragging ? 'none' : 'transform 0.1s ease'}
        onMouseDown={dragMode ? handleMouseDown : undefined}
        onMouseEnter={dragMode ? handleMouseEnter : undefined}
        onMouseLeave={dragMode ? handleMouseLeave : undefined}
        // 兜底：鼠标抬起后若未按快捷键，关闭拖拽模式
        onMouseUp={() => { if (!dragPressedRef.current) setDragMode(false); }}
      >
        <SubtitleText text={subtitleText} style={{ ...textStyle, pointerEvents: dragMode ? 'auto' : 'none' }} />
      </Box>
    </Box>
  );
});

Subtitle.displayName = 'Subtitle';

export default Subtitle;
