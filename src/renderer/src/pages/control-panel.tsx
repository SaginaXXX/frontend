import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Grid, 
  Tabs, 
  Button, 
  IconButton, 
  HStack, 
  Text,
  Kbd,
  Heading,
  Flex,
} from '@chakra-ui/react';
// removed unused imports
import { FiX, FiSettings, FiAperture, FiMic, FiVolume2, FiCpu, FiFilm, FiInfo } from 'react-icons/fi';
// removed unused imports

// 导入所有需要的设置组件
import General from '@/components/sidebar/setting/general';
import Live2D from '@/components/sidebar/setting/live2d';
import ASR from '@/components/sidebar/setting/asr';
import TTS from '@/components/sidebar/setting/tts';
import Agent from '@/components/sidebar/setting/agent';
import Media from '@/components/sidebar/setting/media';
import About from '@/components/sidebar/setting/about';

// 仅保留设置相关组件

// 导入hooks
// import { useAiStore } from '@/store';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  useViewportBounds?: boolean; // 使面板仅覆盖裁剪视口容器
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose, useViewportBounds = false }) => {
  // single section only (settings)
  const [activeSettingTab, setActiveSettingTab] = useState('general');
  const [saveHandlers, setSaveHandlers] = useState<(() => void)[]>([]);
  const [cancelHandlers, setCancelHandlers] = useState<(() => void)[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);
  
  // keep store available for settings (reserved for future); no AI state display here
  // const { status: aiState } = useAiStore();

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 根据容器宽度而非视口宽度切换响应式（兼容裁剪/缩放模式）
  useEffect(() => {
    const el = panelContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Chakra 默认 md=768px，这里沿用该阈值
        setIsSmallScreen(width < 768);
      }
    });
    observer.observe(el);
    // 初始测量
    setIsSmallScreen(el.getBoundingClientRect().width < 768);
    return () => observer.disconnect();
  }, [panelContainerRef]);

  // 设置保存/取消处理器
  const handleSaveCallback = useCallback((handler: () => void) => {
    setSaveHandlers((prev) => [...prev, handler]);
    return (): void => {
      setSaveHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleCancelCallback = useCallback((handler: () => void) => {
    setCancelHandlers((prev) => [...prev, handler]);
    return (): void => {
      setCancelHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  const handleSaveAll = useCallback((): void => {
    saveHandlers.forEach((handler) => handler());
  }, [saveHandlers]);

  const handleCancelAll = useCallback((): void => {
    cancelHandlers.forEach((handler) => handler());
  }, [cancelHandlers]);

  // AI状态显示 - 修复状态类型匹配
  // removed unused helpers after hiding non-settings panels

  if (!isOpen) return null;

  return (
    <Box
      position={useViewportBounds ? 'absolute' : 'fixed'}
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(10px)"
      zIndex={9999}
      display="flex"
      alignItems={useViewportBounds ? 'stretch' : 'center'}
      justifyContent={useViewportBounds ? 'stretch' : 'center'}
      overflow={useViewportBounds ? 'hidden' : 'auto'}
    >
      <Box
        bg={{ base: 'rgba(255,255,255,0.92)', md: 'rgba(255,255,255,0.86)' }}
        borderRadius={useViewportBounds ? 0 : { base: 0, md: 'xl' }}
        width={useViewportBounds ? '100%' : { base: '100vw', md: '90vw' }}
        height={useViewportBounds ? '100%' : { base: '100vh', md: '90vh' }}
        maxWidth={useViewportBounds ? '100%' : { base: '100vw', md: '1200px' }}
        border={useViewportBounds ? 'none' : { base: 'none', md: '1px solid' }}
        borderColor={{ base: 'transparent', md: 'whiteAlpha.400' }}
        overflow={useViewportBounds ? 'auto' : 'auto'}
        position="relative"
        boxShadow={useViewportBounds ? 'none' : { base: 'none', md: 'xl' }}
        minW="0"
        minH="0"
        display="flex"
        flexDirection="column"
        ref={panelContainerRef}
        backdropFilter="saturate(180%) blur(14px)"
      >
        {/* 头部 */}
        <Flex
          p={isSmallScreen ? '3' : '4'}
          bg={isSmallScreen ? 'whiteAlpha.700' : 'whiteAlpha.500'}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="whiteAlpha.600"
          position="sticky"
          top={0}
          zIndex={1}
          backdropFilter="saturate(160%) blur(8px)"
        >
          <Heading size="lg" color="gray.800">
            ⚙️ コントロールパネル
          </Heading>
          
          <HStack gap={2}>
            <Text fontSize="xs" color="gray.700">
              <Kbd>Esc</Kbd> 閉じる
            </Text>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={onClose}
              color="gray.700"
              _hover={{ color: 'gray.800' }}
            >
              <FiX />
            </IconButton>
          </HStack>
        </Flex>

        {/* 主要区域：使用 Tabs 作为外层，使导航可垂直显示 */}
        <Tabs.Root
          value={activeSettingTab}
          onValueChange={(details) => setActiveSettingTab(details.value)}
          h="100%"
        >
          <Grid
            templateColumns={isSmallScreen ? '1fr' : '220px 1fr'}
            h="100%"
            minW="0"
            minH="0"
            flex="1 1 auto"
          >
            {/* 导航：左侧竖排（始终垂直显示） */}
            <Box
              bg="gray.100"
              p="3"
              borderRight={isSmallScreen ? 'none' : '1px solid'}
              borderBottom={isSmallScreen ? '1px solid' : 'none'}
              borderColor="gray.200"
              overflowY={isSmallScreen ? 'visible' : 'auto'}
              overflowX={isSmallScreen ? 'auto' : 'visible'}
            >
              <Tabs.List
                display="flex"
                flexDirection={isSmallScreen ? 'row' : 'column'}
                flexWrap={isSmallScreen ? 'wrap' : 'nowrap'}
                gap={2}
              >
                <Tabs.Trigger value="general">
                  <HStack as="span" gap={2} align="center">
                    <FiSettings />
                    <span>一般設定</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="live2d">
                  <HStack as="span" gap={2} align="center">
                    <FiAperture />
                    <span>Live2D</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="asr">
                  <HStack as="span" gap={2} align="center">
                    <FiMic />
                    <span>音声認識</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="tts">
                  <HStack as="span" gap={2} align="center">
                    <FiVolume2 />
                    <span>音声合成</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="agent">
                  <HStack as="span" gap={2} align="center">
                    <FiCpu />
                    <span>エージェント</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="media">
                  <HStack as="span" gap={2} align="center">
                    <FiFilm />
                    <span>メディア</span>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="about">
                  <HStack as="span" gap={2} align="center">
                    <FiInfo />
                    <span>情報</span>
                  </HStack>
                </Tabs.Trigger>
              </Tabs.List>
            </Box>

            {/* 内容区 */}
            <Box p={{ base: 3, md: 4 }} overflow="auto" minW="0" minH="0">
              <Tabs.ContentGroup>
                <Tabs.Content value="general">
                  <General onSave={handleSaveCallback} onCancel={handleCancelCallback} />
                </Tabs.Content>
                <Tabs.Content value="live2d">
                  <Live2D onSave={handleSaveCallback} onCancel={handleCancelCallback} />
                </Tabs.Content>
                <Tabs.Content value="asr">
                  <ASR onSave={handleSaveCallback} onCancel={handleCancelCallback} />
                </Tabs.Content>
                <Tabs.Content value="tts">
                  <TTS />
                </Tabs.Content>
                <Tabs.Content value="agent">
                  <Agent onSave={handleSaveCallback} onCancel={handleCancelCallback} />
                </Tabs.Content>
                <Tabs.Content value="media">
                  <Media onSave={handleSaveCallback} onCancel={handleCancelCallback} />
                </Tabs.Content>
                <Tabs.Content value="about">
                  <About />
                </Tabs.Content>
              </Tabs.ContentGroup>

              <HStack mt="4" justify="flex-end">
                <Button variant="outline" colorPalette="gray" onClick={handleCancelAll}>キャンセル</Button>
                <Button colorPalette="purple" onClick={handleSaveAll}>保存</Button>
              </HStack>
            </Box>
          </Grid>
        </Tabs.Root>
      </Box>
    </Box>
  );
};

export default ControlPanel;