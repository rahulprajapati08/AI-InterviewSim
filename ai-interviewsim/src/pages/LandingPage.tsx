import React, { useEffect } from 'react'
import {
  Box,
  Button,
  Flex,
  Image,
  useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/logo.png' // Make sure this exists

export default function LandingPage() {
 const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
       //If logged in, redirect to dashboard
      navigate('/dashboard'); // or your preferred homepage
    }
  }, [navigate]);

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, #e0f0ff, #f7fbff)"
      p={4}
    >
      <Box
        bg="rgba(255, 255, 255, 0.25)"
        boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
        backdropFilter="blur(8px)"
        borderRadius="xl"
        p={[6, 10]}
        textAlign="center"
        maxW="420px"
        w="100%"
      >
        <Image
          src={logoImage}
          alt="AI InterviewSim Logo"
          mb={6}
          borderRadius="lg"
        />

        <Flex justify="center" gap={4} flexWrap="wrap">
          <Button
            colorScheme="blue"
            size="lg"
            px={8}
            onClick={() => navigate('/login')}
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.2s"
          >
            Log in
          </Button>
          <Button
            size="lg"
            variant="outline"
            borderColor="blue.600"
            color="blue.700"
            px={8}
            onClick={() => navigate('/signup')}
            _hover={{ bg: 'blue.50' }}
            transition="all 0.2s"
          >
            Sign up
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}