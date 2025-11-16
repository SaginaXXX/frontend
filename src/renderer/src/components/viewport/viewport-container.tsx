import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Viewport } from '../../hooks/utils/use-viewport';

interface ViewportContainerProps {
  viewport: Viewport;
  vpDebug: boolean;
  children: ReactNode;
}

/**
 * 视口容器组件 - 提供统一的裁剪窗口
 */
export function ViewportContainer({ viewport, vpDebug, children }: ViewportContainerProps) {
  return (
    <Box
      id="viewport"
      position="absolute"
      left={`${viewport.x}px`}
      top={`${viewport.y}px`}
      width={`${viewport.w}px`}
      height={`${viewport.h}px`}
      overflow="hidden"
      bg="transparent"
      border={vpDebug ? '2px solid #0ff' : 'none'}
    >
      {children}
    </Box>
  );
}

