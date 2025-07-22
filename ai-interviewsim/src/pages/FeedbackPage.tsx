import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  CircularProgress,
  CircularProgressLabel,
  SimpleGrid,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { fetchWithAuth } from '../utils/fetchWithAuth'

const renderRadarChart = (data: any) => {
  const chartData =
    data.correctness !== undefined
      ? [
          { metric: 'Correctness', value: data.correctness },
          { metric: 'Clarity', value: data.clarity },
          { metric: 'Edge Cases', value: data.edge_cases },
          { metric: 'Efficiency', value: data.efficiency },
          { metric: 'Overall', value: data.overall },
        ]
      : [
          { metric: 'Relevance', value: data.relevance },
          { metric: 'Clarity', value: data.clarity },
          { metric: 'Depth', value: data.depth },
          { metric: 'Examples', value: data.examples },
          { metric: 'Communication', value: data.communication },
          { metric: 'Overall', value: data.overall },
        ]

  return (
    <Box w="100%" h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={30} domain={[0, 5]} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#3182CE"
            fill="#3182CE"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any | null>(null)
  const cardBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    let didFetch = false;
    const fetchFeedback = async () => {
      if (didFetch) return;
      didFetch = true;
      const res = await fetchWithAuth('http://localhost:5000/api/feedback');
      const data = await res.json();
      setFeedback(data);
    };
    fetchFeedback();
  }, []);

  const renderSection = (label: string, data: any) => (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={6}
      w="100%"
      boxShadow="md"
      bg={cardBg}
    >
      <Heading size="md" mb={4}>
        {label}
      </Heading>
      <SimpleGrid columns={[1, null, 2]} spacing={6}>
        {renderRadarChart(data)}
        <Box>
          <Text fontWeight="bold" mb={1}>
            Summary:
          </Text>
          <Text whiteSpace="pre-wrap">{data.summary}</Text>
        </Box>
      </SimpleGrid>
    </Box>
  )

  return (
    <Box p={8}>
      <Heading size="lg" mb={6}>
        📋 Interview Feedback
      </Heading>

      {!feedback ? (
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#f5f8ff">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="md" color="gray.600">Loading...</Text>
        </VStack>
      </Box>
      ) : (
        <VStack spacing={8} align="stretch">
          {feedback.technical && renderSection('🧠 Technical', feedback.technical)}
          {feedback.coding && renderSection('💻 Coding', feedback.coding)}
          {feedback.behavioral && renderSection('👤 HR', feedback.behavioral)}

          {!('technical' in feedback) &&
            !('coding' in feedback) &&
            !('behavioral' in feedback) &&
            feedback.summary && renderSection('📝 Interview', feedback)}

          <SimpleGrid columns={[1, 2]} spacing={10} textAlign="center" mt={6}>
            <Box>
              <Text mb={2} fontWeight="medium">
                🎤 Average Confidence
              </Text>
              <CircularProgress value={feedback.average_confidence * 20} color="blue.400" size="120px">
                <CircularProgressLabel>{feedback.average_confidence.toFixed(1)}</CircularProgressLabel>
              </CircularProgress>
            </Box>
            <Box>
              <Text mb={2} fontWeight="medium">
                👀 Average Focus
              </Text>
              <CircularProgress value={feedback.average_focus * 100} color="green.400" size="120px">
                <CircularProgressLabel>{(feedback.average_focus * 100).toFixed(0)}%</CircularProgressLabel>
              </CircularProgress>
            </Box>
          </SimpleGrid>

          <Button
            mt={8}
            colorScheme="blue"
            size="lg"
            alignSelf="center"
            onClick={() => (window.location.href = '/')}
          >
            🔁 Practice Again
          </Button>
        </VStack>
      )}
    </Box>
  )
}
