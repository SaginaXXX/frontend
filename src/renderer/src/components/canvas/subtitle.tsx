import { Box, Text } from '@chakra-ui/react';
import { memo, useMemo } from 'react';
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

  if (!isLoaded || !subtitleText || !showSubtitle) return null;

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
      maxWidth: cfg.maxWidth ?? '90%',
    } as any;
  }, [appConfig?.subtitle]);

  const textStyle = useMemo(() => {
    const c = (appConfig?.subtitle as any)?.textColor;
    return c ? ({ color: c } as React.CSSProperties) : undefined;
  }, [appConfig?.subtitle?.textColor]);

  return (
    <Box
      ref={elementRef}
      {...canvasStyles.subtitle.container}
      cursor={isDragging ? 'grabbing' : 'grab'}
      transition={isDragging ? 'none' : 'transform 0.1s ease'}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={bgStyle}
    >
      <SubtitleText text={subtitleText} style={textStyle} />
    </Box>
  );
});

Subtitle.displayName = 'Subtitle';

export default Subtitle;
