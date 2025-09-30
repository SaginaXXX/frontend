import { Box, Text } from '@chakra-ui/react';
import { useAiStore } from '@/store';
import { footerStyles } from './footer-styles';

function AIStateIndicator(): JSX.Element {
  const { status: aiState } = useAiStore();
  const styles = footerStyles.aiIndicator;

  return (
    <Box {...styles.container}>
      <Text {...styles.text}>{aiState}</Text>
    </Box>
  );
}

export default AIStateIndicator;
