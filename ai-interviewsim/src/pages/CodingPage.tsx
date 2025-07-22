import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  useColorModeValue,
  keyframes,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useRecorder } from '../hooks/useRecorder';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Editor from '@monaco-editor/react';
import RecruiterAvatar from '../components/RecruiterAvatar';

const blink = keyframes`
  0% { opacity: 0.2; }
  100% { opacity: 1; }
`;

const DotTypingAnimation = () => (
  <HStack spacing={1} mt={2}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <Box
        key={i}
        w="6px"
        h="6px"
        bg="gray.500"
        borderRadius="full"
        animation={`${blink} 1s ${delay}s infinite alternate`}
      />
    ))}
  </HStack>
);

export default function CodingPage() {
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<{ sender: 'AI' | 'You'; text: string }[]>([
    { sender: 'AI', text: 'Explain your approach before submitting your code.' },
  ]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const { isRecording, startRecording, stopRecording } = useRecorder();
  const navigate = useNavigate();

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    fetchWithAuth('http://localhost:5000/api/coding-problem')
      .then((res) => res.json())
      .then((data) => setProblem(data))
      .catch(() => navigate('/interview'));
  }, []);

  const handleRecord = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      const audioBlob = await stopRecording();
      const formData = new FormData();
      formData.append('audio', audioBlob);

      setIsThinking(true);

      const res = await fetchWithAuth('http://localhost:5000/api/code-explanation', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'You', text: data.user_text },
        { sender: 'AI', text: data.response },
      ]);
      speak(data.response);
      setIsThinking(false);
    }
  };

  const handleSubmit = async () => {
    const res = await fetchWithAuth('http://localhost:5000/api/submit-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'You', text: 'You submitted your code.' },
        { sender: 'AI', text: 'Now solve the next question.' },
      ]);
      speak(data.feedback);

      if (data.next && data.problem) {
        setProblem(data.problem);
        setCode('');
      } else {
        navigate('/interview');
      }
    }
  };

  const chatBg = useColorModeValue('gray.50', 'gray.800');
  const bubbleBgAI = useColorModeValue('gray.100', 'gray.700');
  const bubbleBgUser = useColorModeValue('blue.100', 'blue.600');

  return (
    <Box p={4}>
      <Flex direction={['column', 'row']} gap={6} height="100vh">
        {/* Left: Chat Transcript */}
        <Box flex="1" bg={chatBg} borderRadius="md" p={4} position="relative" display="flex" flexDirection="column">
          <Heading size="md" mb={4}>Live Transcript</Heading>

          <VStack align="stretch" spacing={3} overflowY="auto" flex="1">
            {messages.map((msg, i) => (
              <HStack
                key={i}
                alignSelf={msg.sender === 'You' ? 'flex-end' : 'flex-start'}
                spacing={2}
              >
                {msg.sender === 'AI' && <Avatar size="sm" name="AI" bg="purple.500" />}
                <Box
                  bg={msg.sender === 'AI' ? bubbleBgAI : bubbleBgUser}
                  color={msg.sender === 'AI' ? 'black' : 'white'}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  maxW="75%"
                  boxShadow="sm"
                >
                  <Text fontSize="sm" whiteSpace="pre-wrap">{msg.text}</Text>
                </Box>
              </HStack>
            ))}

            {isThinking && (
              <HStack alignSelf="flex-start">
                <Avatar size="sm" name="AI" bg="purple.500" />
                <DotTypingAnimation />
              </HStack>
            )}
          </VStack>

          {/* Animated Recruiter Avatar */}
          <Box position="absolute" bottom={4} right={4}>
            <RecruiterAvatar isSpeaking={aiSpeaking} />
          </Box>

          <Button
            mt={6}
            colorScheme={isRecording ? 'red' : 'blue'}
            onClick={handleRecord}
            isDisabled={aiSpeaking}
          >
            {isRecording ? 'Stop Recording' : 'Start Speaking'}
          </Button>
        </Box>

        {/* Right: Coding Editor */}
        <Box flex="2" bg="white" borderRadius="md" p={4} overflow="hidden">
          <Heading size="md" mb={3}>Coding Round</Heading>

          {problem && (
            <Box mb={4}>
              <Text fontWeight="bold">{problem.title}</Text>
              <Text fontSize="sm" color="gray.600">{problem.description}</Text>
              <Text fontSize="sm" color="blue.600" mt={2}>{problem.function_signature}</Text>
            </Box>
          )}

          <Box h="300px" border="1px solid #ccc" borderRadius="md" overflow="hidden">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-light"
              options={{
                fontSize: 14,
                formatOnType: true,
                autoIndent: 'full',
                minimap: { enabled: false },
              }}
            />
          </Box>

          <Button mt={4} colorScheme="green" onClick={handleSubmit}>
            Submit Code
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
