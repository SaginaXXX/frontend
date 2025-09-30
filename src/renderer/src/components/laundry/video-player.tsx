import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton } from '@chakra-ui/react';
import { FiX, FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';

interface VideoPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  autoClose?: boolean;
  onClose?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title = "解説動画",
  autoPlay = true,
  autoClose = true,
  onClose,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (import.meta.env?.MODE === 'development') {
      console.log('VideoPlayer: Setting up video with src:', src);
    }

    const handleLoadedData = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Video loaded successfully');
      }
      if (autoPlay) {
        video.play().catch(err => {
          console.error('VideoPlayer: Autoplay failed:', err);
        });
        setIsPlaying(true);
      }
    };

    const handlePlay = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Video started playing');
      }
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Video paused');
      }
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Video ended');
      }
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
      if (autoClose) {
        // 3秒后自动关闭
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 3000);
      }
    };

    const handleError = (e: Event) => {
      console.error('VideoPlayer: Video error occurred:', e);
      console.error('VideoPlayer: Video error details:', video.error);
      console.error('VideoPlayer: Current src:', video.src);
    };

    const handleLoadStart = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Load start');
      }
    };

    const handleCanPlay = () => {
      if (import.meta.env?.MODE === 'development') {
        console.log('VideoPlayer: Can play');
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [src, autoPlay, autoClose, onClose, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.error('VideoPlayer: Play failed:', err);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // 控制栏自动隐藏
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimer();
    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
      resetTimer();
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPlaying, isFullscreen]);

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      width="100%"
      height="100%"
      bg="transparent"
      zIndex="10"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* 视频容器 */}
      <Box
        position="relative"
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <video
          ref={videoRef}
          src={src}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          controls={false}
          playsInline
        />

        {/* 控制层 */}
        {showControls && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            pointerEvents="none"
          >
            {/* 顶部标题栏 */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              height="60px"
              bg="linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px="20px"
              pointerEvents="auto"
            >
              <Box color="white" fontSize="lg" fontWeight="bold">
                {title}
              </Box>
              <IconButton
                aria-label="关闭"
                variant="ghost"
                colorScheme="whiteAlpha"
                size="lg"
                onClick={handleClose}
              >
                <FiX />
              </IconButton>
            </Box>

            {/* 中央播放按钮 */}
            {!isPlaying && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                pointerEvents="auto"
              >
                <IconButton
                  aria-label="播放"
                  size="xl"
                  variant="solid"
                  colorScheme="whiteAlpha"
                  bg="rgba(255,255,255,0.9)"
                  color="black"
                  fontSize="60px"
                  width="120px"
                  height="120px"
                  borderRadius="50%"
                  onClick={togglePlay}
                >
                  <FiPlay />
                </IconButton>
              </Box>
            )}

            {/* 底部控制栏 */}
            <Box
              position="absolute"
              bottom="0"
              left="0"
              right="0"
              height="80px"
              bg="linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px="20px"
              pointerEvents="auto"
            >
              <Box display="flex" alignItems="center" gap="4">
                <IconButton
                  aria-label={isPlaying ? "暂停" : "播放"}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="lg"
                  onClick={togglePlay}
                >
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </IconButton>
                
                <IconButton
                  aria-label={isMuted ? "取消静音" : "静音"}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="lg"
                  onClick={toggleMute}
                >
                  {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                </IconButton>

                <Button
                  variant="solid"
                  colorScheme="blue"
                  size="md"
                  onClick={handleClose}
                  ml="4"
                >
                  关闭视频
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* 点击视频切换播放状态 */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          cursor="pointer"
          onClick={togglePlay}
          pointerEvents={showControls ? "none" : "auto"}
        />
      </Box>
    </Box>
  );
};

export default VideoPlayer;