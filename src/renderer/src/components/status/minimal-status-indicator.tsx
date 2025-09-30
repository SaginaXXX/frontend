import { Box, HStack, Text, Kbd, IconButton } from '@chakra-ui/react';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { memo } from 'react';
import { useAiStore } from '@/store';
import { useVAD } from '@/context/vad-context';

interface MinimalStatusIndicatorProps {
  onOpenControlPanel: () => void;
}

const MinimalStatusIndicator = memo(({ onOpenControlPanel }: MinimalStatusIndicatorProps) => {
  const { status: aiState } = useAiStore();
  const { micOn } = useVAD();

  const getAiStateColor = () => {
    switch (aiState) {
      case 'idle': return 'gray.500';
      case 'listening': return 'blue.500';
      case 'thinking': return 'yellow.500';
      case 'speaking': return 'green.500';
      case 'interrupted': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getAiStateText = () => {
    switch (aiState) {
      case 'idle': return '待机';
      case 'listening': return '听取';
      case 'thinking': return '思考';
      case 'speaking': return '说话';
      case 'interrupted': return '中断';
      default: return '未知';
    }
  };

  return (
    <Box
      position="fixed"
      top="20px"
      right="20px"
      bg="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      borderRadius="lg"
      p="3"
      border="1px solid"
      borderColor="whiteAlpha.300"
      zIndex={1000}
      minW="200px"
    >
      <HStack spacing={3} justify="space-between">
        {/* AI状态显示 */}
        <HStack spacing={2}>
          <Box
            w="8px"
            h="8px"
            bg={getAiStateColor()}
            borderRadius="full"
          />
          <Text fontSize="sm" color="whiteAlpha.900">
            {getAiStateText()}
          </Text>
        </HStack>

        {/* 麦克风状态 */}
        <HStack spacing={2}>
          <Box color={micOn ? 'green.400' : 'red.400'}>
            {micOn ? <BsMicFill size={14} /> : <BsMicMuteFill size={14} />}
          </Box>
        </HStack>

        {/* 控制面板按钮 */}
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onOpenControlPanel}
          color="whiteAlpha.700"
          _hover={{ color: 'white' }}
        >
          <FiSettings />
        </IconButton>
      </HStack>

      {/* 快捷键提示 */}
      <HStack spacing={1} mt="2" justify="center">
        <Text fontSize="xs" color="whiteAlpha.600">
          <Kbd fontSize="xs">Ctrl</Kbd> + <Kbd fontSize="xs">Space</Kbd>
        </Text>
        <Text fontSize="xs" color="whiteAlpha.600">
          控制面板
        </Text>
      </HStack>
    </Box>
  );
});

MinimalStatusIndicator.displayName = 'MinimalStatusIndicator';

export default MinimalStatusIndicator; 