import {
  Box, Button, Container, Heading, Input, Select, Text, VStack,
  RadioGroup, Radio, Stack, useToast, Spinner, useColorModeValue
} from '@chakra-ui/react'

import { fetchWithAuth } from '../utils/fetchWithAuth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SetupPage() {
  const [role, setRole] = useState('')
  const [interviewType, setInterviewType] = useState<'full' | 'custom'>('full')
  const [customRound, setCustomRound] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toast = useToast()
  const navigate = useNavigate()

  const cardBg = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.700", "gray.100")

  const handleStart = async () => {
    if (!role || (interviewType === 'custom' && !customRound)) {
      toast({
        title: 'Incomplete form',
        description: 'Please select all required fields.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("role", role)
    formData.append("interview_type", interviewType)
    formData.append("custom_round", customRound)

    try {
      const res = await fetchWithAuth("http://localhost:5000/api/setup", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        navigate('/interview')
      } else {
        const err = await res.json()
        toast({ title: 'Setup failed', description: err.detail, status: 'error' })
      }
    } catch (err) {
      toast({ title: 'Setup error', description: 'Could not reach server.', status: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="lg" py={10}>
      <Box p={8} borderRadius="lg" boxShadow="lg" bg={cardBg}>
        <Heading size="lg" mb={6} textAlign="center" color="teal.400">
          Setup Your Interview
        </Heading>

        <VStack spacing={5} align="stretch">
          <Box>
            <Text mb={1} fontWeight="medium" color={textColor}>Select Role</Text>
            <Select
              placeholder="Choose a role"
              onChange={(e) => setRole(e.target.value)}
              bg="gray.50"
              _dark={{ bg: "gray.700" }}
            >
              <option value="sde">Software Developer (SDE)</option>
              <option value="DS">Data Scientist</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
            </Select>
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color={textColor}>Interview Type</Text>
            <RadioGroup value={interviewType} onChange={(val) => setInterviewType(val as 'full' | 'custom')}>
              <Stack direction="row">
                <Radio value="full" colorScheme="teal">Full</Radio>
                <Radio value="custom" colorScheme="teal">Custom</Radio>
              </Stack>
            </RadioGroup>
          </Box>

          {interviewType === 'custom' && (
            <Box>
              <Text mb={1} fontWeight="medium" color={textColor}>Select Round</Text>
              <Select
                placeholder="Choose a round"
                onChange={(e) => setCustomRound(e.target.value)}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
              >
                <option value="technical">Technical Round</option>
                <option value="behavioral">Behavioral (HR) Round</option>
                
              </Select>
            </Box>
          )}

          <Box>
            <Button
              colorScheme="teal"
              w="full"
              onClick={handleStart}
              isDisabled={isLoading}
              leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
            >
              {isLoading ? 'Setting up...' : 'Start Interview'}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Container>
  )
}
