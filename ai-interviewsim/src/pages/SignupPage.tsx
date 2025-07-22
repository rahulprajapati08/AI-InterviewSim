// src/pages/SignupPage.tsx
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const toast = useToast()
  const navigate = useNavigate()

  const handleSignup = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password}),
      })

      if (res.ok) {
        toast({ title: 'Signup successful!', status: 'success' })
        navigate('/login')
      } else {
        const data = await res.json()
        toast({ title: 'Signup failed', description: data.detail, status: 'error' })
      }
    } catch (err) {
      toast({ title: 'Error signing up', status: 'error' })
    }
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #e6f0ff, #f7fbff)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="100%"
        maxW="420px"
        bg="white"
        boxShadow="xl"
        borderRadius="xl"
        p={8}
      >
        <Heading size="lg" mb={6} textAlign="center" color="#002D62">
          Create Account
        </Heading>

        <VStack spacing={5}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </FormControl>

          

          <Button
            colorScheme="blue"
            w="100%"
            size="lg"
            onClick={handleSignup}
            _hover={{ transform: 'scale(1.02)' }}
            transition="all 0.2s"
          >
            Sign Up
          </Button>

          <Text fontSize="sm" color="gray.600">
            Already have an account?{' '}
            <Text
              as="span"
              color="blue.500"
              fontWeight="semibold"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={() => navigate('/login')}
            >
              Log in
            </Text>
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}
