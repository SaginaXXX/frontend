/**
 * MCP Canvas 内容渲染组件
 * 根据内容类型渲染图片、视频或地图
 */

import { memo, useState, useCallback } from 'react';
import { Box, Image, Spinner, Text } from '@chakra-ui/react';
import { MCPContentType, MCPContentData } from '@/store';
import { useAppStore } from '@/store';

interface MCPCanvasContentProps {
  contentType: MCPContentType;
  contentData: MCPContentData | null;
}

/**
 * 图片内容组件
 */
const ImageContent = memo(({ data }: { data: MCPContentData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    console.log('🖼️ MCP Image: 加载完成');
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error('❌ MCP Image: 加载失败', data.url);
  };

  if (!data.url) {
    return <Text color="red.500">图片 URL 缺失</Text>;
  }

  return (
    <Box position="relative" width="100%" height="100%">
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        >
          <Spinner size="lg" />
        </Box>
      )}
      {hasError ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Text color="red.500">图片加载失败</Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            {data.url}
          </Text>
        </Box>
      ) : (
        <Image
          src={data.url}
          alt={data.alt || data.title || '图片'}
          width="100%"
          height="100%"
          objectFit="contain"
          onLoad={handleLoad}
          onError={handleError}
          display={isLoading ? 'none' : 'block'}
        />
      )}
      {data.title && (
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
          {data.title}
        </Box>
      )}
    </Box>
  );
});

/**
 * 视频内容组件
 */
const VideoContent = memo(({ data }: { data: MCPContentData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const setMCPVideoPlaying = useAppStore((s) => s.setMCPVideoPlaying);
  const setAiState = useAppStore((s) => s.setAiState);
  const hideMCPContent = useAppStore((s) => s.hideMCPContent);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    console.log('🎬 MCP Video: 加载完成');
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error('❌ MCP Video: 加载失败', data.url);
  }, [data.url]);

  const handlePlay = useCallback(() => {
    setMCPVideoPlaying(true);
    // AI 暂停说话
    setAiState('waiting');
    console.log('▶️ MCP Video: 开始播放，AI 暂停');
  }, [setMCPVideoPlaying, setAiState]);

  const handleEnded = useCallback(() => {
    setMCPVideoPlaying(false);
    // AI 恢复
    setAiState('idle');
    console.log('⏹️ MCP Video: 播放结束，AI 恢复');
    
    // 延迟关闭画布
    setTimeout(() => {
      hideMCPContent();
    }, 1000);
  }, [setMCPVideoPlaying, setAiState, hideMCPContent]);

  if (!data.url) {
    return <Text color="red.500">视频 URL 缺失</Text>;
  }

  return (
    <Box position="relative" width="100%" height="100%">
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        >
          <Spinner size="lg" />
        </Box>
      )}
      {hasError ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Text color="red.500">视频加载失败</Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            {data.url}
          </Text>
        </Box>
      ) : (
        <video
          src={data.url}
          poster={data.poster}
          autoPlay={data.autoplay !== false}
          loop={data.loop || false}
          muted={data.muted || false}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: isLoading ? 'none' : 'block',
          }}
          onLoadedData={handleLoadedData}
          onError={handleError}
          onPlay={handlePlay}
          onEnded={handleEnded}
        />
      )}
    </Box>
  );
});

/**
 * 地图内容组件
 * TODO: 集成 Leaflet 或其他地图库
 */
const MapContent = memo(({ data }: { data: MCPContentData }) => {
  if (!data.mapData) {
    return <Text color="red.500">地图数据缺失</Text>;
  }

  const { latitude, longitude, zoom = 15 } = data.mapData;

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bg="gray.100"
    >
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        🗺️ 地图功能
      </Text>
      <Text fontSize="sm" color="gray.600">
        纬度: {latitude}
      </Text>
      <Text fontSize="sm" color="gray.600">
        经度: {longitude}
      </Text>
      <Text fontSize="sm" color="gray.600">
        缩放: {zoom}
      </Text>
      <Text fontSize="xs" color="gray.500" mt={4}>
        (TODO: 集成 Leaflet 地图库)
      </Text>
    </Box>
  );
});

/**
 * MCP Canvas 内容组件
 */
export const MCPCanvasContent = memo(({ contentType, contentData }: MCPCanvasContentProps) => {
  if (!contentType || !contentData) {
    return <Text color="gray.500">无内容</Text>;
  }

  switch (contentType) {
    case 'image':
      return <ImageContent data={contentData} />;
    case 'video':
      return <VideoContent data={contentData} />;
    case 'map':
      return <MapContent data={contentData} />;
    default:
      return <Text color="red.500">不支持的内容类型: {contentType}</Text>;
  }
});

MCPCanvasContent.displayName = 'MCPCanvasContent';
ImageContent.displayName = 'ImageContent';
VideoContent.displayName = 'VideoContent';
MapContent.displayName = 'MapContent';

