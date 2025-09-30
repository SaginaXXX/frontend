import { Box } from '@chakra-ui/react';
import Background from './background';
import Subtitle from './subtitle';
import { Live2D } from './live2d';
import { canvasStyles } from './canvas-styles';

function Canvas(): JSX.Element {
  return (
    <Background>
      <Box {...canvasStyles.canvas.container}>
        {/* Force remount Live2D when model url changes to ensure switch takes effect */}
        <Live2D isPet={false} />
        <Subtitle />
      </Box>
    </Background>
  );
}

export default Canvas;
