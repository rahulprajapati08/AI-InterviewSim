import { Box, HStack } from '@chakra-ui/react';

const DotTypingAnimation = () => (
  <HStack spacing={1}>
    <Box
      w="6px"
      h="6px"
      bg="gray.500"
      borderRadius="full"
      animation="blink 1s infinite alternate"
    />
    <Box
      w="6px"
      h="6px"
      bg="gray.500"
      borderRadius="full"
      animation="blink 1s infinite 0.2s alternate"
    />
    <Box
      w="6px"
      h="6px"
      bg="gray.500"
      borderRadius="full"
      animation="blink 1s infinite 0.4s alternate"
    />
  </HStack>
);

export default DotTypingAnimation;
