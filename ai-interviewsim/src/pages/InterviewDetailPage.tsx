import {
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  Spinner,
  Avatar,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

function renderRadarChart(data: any) {
  const chartData = data.correctness !== undefined
    ? [ // Coding feedback
        { metric: 'Correctness', value: data.correctness },
        { metric: 'Clarity', value: data.clarity },
        { metric: 'Edge Case Handling', value: data.edge_cases },
        { metric: 'Efficiency', value: data.efficiency },
        { metric: 'Overall', value: data.overall },
      ]
    : [ // HR or technical feedback
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
          <Radar name="Score" dataKey="value" stroke="#3182CE" fill="#3182CE" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default function InterviewDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetchWithAuth(`http://localhost:5000/api/interviews/${id}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        toast({ title: 'Error loading interview', status: 'error' })
      }
    }

    fetchDetails()
  }, [id])

  const renderSection = (label: string, feedback: any) => (
    <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50" boxShadow="sm" mb={6}>
      <Heading size="md" mb={2}>{label} Feedback</Heading>
      {renderRadarChart(feedback)}
      <Text mt={4}><strong>Summary:</strong></Text>
      <Text whiteSpace="pre-wrap">{feedback.summary}</Text>
    </Box>
  )

  const renderChatTranscript = (transcript: string) => {
    const lines = transcript.split('\n').filter(line => line.trim() !== '')

    return (
      <VStack align="stretch" spacing={3} mt={4}>
        {lines.map((line, idx) => {
          const isRecruiter = line.startsWith('Q:')
          const isUser = line.startsWith('A:')
          const content = line.replace(/^Q:|^A:/, '').trim()

          return (
            <HStack
              key={idx}
              justify={isUser ? 'flex-end' : 'flex-start'}
              align="flex-start"
              spacing={3}
            >
              {!isUser && (
                <Avatar
                  size="sm"
                  name="Alex"
                  src="/recruiter_avatar.png"
                  bg="gray.200"
                />
              )}
              <Box
                bg={isUser ? 'blue.500' : 'gray.200'}
                color={isUser ? 'white' : 'black'}
                px={4}
                py={2}
                borderRadius="md"
                maxW="70%"
                whiteSpace="pre-wrap"
              >
                <Text fontSize="sm">{content}</Text>
              </Box>
            </HStack>
          )
        })}
      </VStack>
    )
  }

  if (!data) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#f5f8ff">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="md" color="gray.600">Loading interview details...</Text>
        </VStack>
      </Box>
    )
  }
  

  return (
    <Box p={8}>
      <Heading mb={4}>Interview Summary</Heading>
      <HStack spacing={4} mb={6}>
        <Badge colorScheme="blue" fontSize="sm">
          Role: {data.role}
        </Badge>
        <Badge colorScheme="green" fontSize="sm">
          Round: {data.mode}
        </Badge>
      </HStack>

      <VStack spacing={6} align="stretch">
        {data.feedback.technical && renderSection("🧠 Technical", data.feedback.technical)}
        {data.feedback.coding && renderSection("💻 Coding", data.feedback.coding)}
        {data.feedback.behavioral && renderSection("👤 HR", data.feedback.behavioral)}

        {!data.feedback.technical && !data.feedback.coding && !data.feedback.behavioral &&
          renderSection("📝 ", data.feedback.feedback || data.feedback)}

        <Box textAlign="center">
          <Text mb={2}><strong>Average Confidence</strong></Text>
          <CircularProgress value={data.average_confidence * 20} color="blue.400">
            <CircularProgressLabel>{data.average_confidence?.toFixed(1)}</CircularProgressLabel>
          </CircularProgress>
        </Box>

        <Box textAlign="center">
          <Text mt={4} mb={2}><strong>Average Focus</strong></Text>
          <CircularProgress value={data.average_focus * 100} color="green.400">
            <CircularProgressLabel>{(data.average_focus * 100).toFixed(0)}%</CircularProgressLabel>
          </CircularProgress>
        </Box>

        <Button colorScheme="gray" onClick={() => setShowTranscript(prev => !prev)}>
          {showTranscript ? "Hide Transcript" : "Show Transcript"}
        </Button>

        {showTranscript && (
          <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
            <Heading size="sm" mb={2}>Transcript</Heading>
            {renderChatTranscript(data.transcript)}
          </Box>
        )}
      </VStack>
    </Box>
  )
}
