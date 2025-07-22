import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Avatar,
  useColorModeValue,
  HStack,
  Badge,
  keyframes
} from '@chakra-ui/react';
import { useRecorder } from '../hooks/useRecorder';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useAttentionTracker } from '../hooks/useAttentionTracker';
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

export default function InterviewPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const attention = useAttentionTracker(videoRef);
  //const [interviewEnded, setInterviewEnded] = useState(false);
  const interviewEndedRef = useRef(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showTyping, setShowTyping] = useState(false);



  const [messages, setMessages] = useState<{ sender: 'AI' | 'You'; text: string; confidence?: number }[]>([]);



  const { isRecording, startRecording, stopRecording } = useRecorder();

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "green";
    if (score >= 0.5) return "yellow";
    return "red";
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleRecord = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      const audioBlob = await stopRecording();

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('focus_score', attention.toString());

      setShowTyping(true);

      try {
        const res = await fetchWithAuth('http://localhost:5000/api/audio', {
          method: 'POST',
          body: formData,
        });

        const { text: aiText, answer: userText, confidence } = await res.json();

        setMessages((prev) => [
          ...prev,
          { sender: 'You', text: userText, confidence },
        ]);

        setTimeout(() => {
          setShowTyping(false);
          setMessages((prev) => [...prev, { sender: 'AI', text: aiText }]);
          speak(aiText);

          if (aiText.includes("interview is complete") && !interviewEndedRef.current) {
            interviewEndedRef.current = true;
            navigate('/feedback');
          }else if (aiText.toLowerCase().includes("live coding round")) {
            setTimeout(() => navigate("/coding"), 1000);
          } else if (aiText.toLowerCase().includes("behavioral") && !aiText.includes("Thank you")) {
            alert("Now starting the HR round!");
            
          }
        }, 1500); // Simulated thinking time
      } catch (err) {
        setShowTyping(false);
        console.error('API Error:', err);
        alert('Error contacting backend');
      }
    }
  };
  useEffect(() => {
    const fetchInitialHistory = async () => {
      try {
        const res = await fetchWithAuth('http://localhost:5000/api/history');
        const data = await res.json();
  
        if (Array.isArray(data.history) && data.history.length > 0) {
          const formattedMessages = data.history.map((entry: any) => ({
            sender: entry.sender === 'user' ? 'You' : 'AI',
            text: entry.question || entry.answer || '',  // fallback
            confidence: entry.confidence || undefined,
          }));
  
          setMessages(formattedMessages);
          const latestAiMsg = formattedMessages.findLast((m: any) => m.sender === 'AI');
          if (latestAiMsg) speak(latestAiMsg.text);
        }
      } catch (err) {
        console.error("Failed to load initial history:", err);
      }
    };
  
    fetchInitialHistory();
  }, []);
  
  
  // 📸 Setup webcam & greet
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Webcam error:', err);
        alert('Could not access webcam.');
      });

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const chatBg = useColorModeValue("gray.50", "gray.800");
  const bubbleBgAI = useColorModeValue("gray.100", "gray.700");
  const bubbleBgUser = useColorModeValue("blue.100", "blue.600");

  return (
    <Box p={4}>
      <Flex direction={['column', 'row']} gap={6} height="100vh">
        {/* Left: Webcam (3 parts) */}
        <Box flex="3" bg="black" borderRadius="md" overflow="hidden" position="relative">
          <video ref={videoRef} width="100%" autoPlay muted playsInline />
          <RecruiterAvatar isSpeaking={aiSpeaking} />

          <Box position="absolute" top="2" left="2" bg="whiteAlpha.700" px={2} py={1} borderRadius="md">
            <Text fontSize="sm" fontWeight="medium">You</Text>
          </Box>
        </Box>

        {/* Right: Transcript (1 part) */}
        <Box flex="1" bg={chatBg} borderRadius="md" p={4} display="flex" flexDirection="column" justifyContent="space-between">
          <Box>
            <Heading size="md" mb={4}>Live Transcript</Heading>

            <VStack align="stretch" spacing={3} maxH="100vh" overflowY="auto" pr={2}>
              {messages.map((msg, i) => (
                <HStack
                  key={i}
                  alignSelf={msg.sender === 'You' ? 'flex-end' : 'flex-start'}
                  spacing={2}
                >
                  {msg.sender === 'AI' && (
                    <Avatar size="sm" name="AI" bg="purple.500" />
                  )}
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
                    {msg.sender === 'You' && msg.confidence !== undefined && (
                      <Badge
                        mt={1}
                        colorScheme={getConfidenceColor(msg.confidence)}
                        fontSize="0.65em"
                      >
                        Confidence: {getConfidenceLabel(msg.confidence)}
                      </Badge>
                    )}
                  </Box>
                </HStack>
              ))}

              {/* Typing animation */}
              {showTyping && (
                <HStack alignSelf="flex-start">
                  <Avatar size="sm" name="AI" bg="purple.500" />
                  <DotTypingAnimation />
                </HStack>
              )}
            </VStack>
          </Box>

          <Box mt={6}>
            <HStack justify="space-between">
              <Text fontSize="sm" color={attention ? "green.500" : "red.500"}>
                Focus: {attention ? "Focused 👀" : "Away ❌"}
              </Text>

              <Button
                colorScheme={isRecording ? 'red' : 'green'}
                onClick={handleRecord}
                isDisabled={aiSpeaking}
              >
                {isRecording ? 'Stop Recording' : 'Start Speaking'}
              </Button>
            </HStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
