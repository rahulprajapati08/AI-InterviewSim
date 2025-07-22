import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SetupPage from './pages/SetupPage'
import InterviewPage from './pages/InterviewPage'
import FeedbackPage from './pages/FeedbackPage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import CodingPage from './pages/CodingPage'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/isAuthenticated'
import Dashboard from './pages/DashBoard'
import InterviewDetailPage from './pages/InterviewDetailPage'
import ProfileSetup from "./pages/ProfileSetup"
import LandingPage from './pages/LandingPage'

function App() {
  useEffect(() => {
    document.title = "AI InterviewSim "
  }, [])
  return (
    
    <ChakraProvider>
      
      
      <BrowserRouter>
        <Routes>
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/"
            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          
          <Route
            path="/interview"
            element={isAuthenticated() ? <InterviewPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/feedback"
            element={isAuthenticated() ? <FeedbackPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/coding"
            element={isAuthenticated() ? <CodingPage /> : <Navigate to="/login" replace />}
          />
          
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/interview/:id" element={<InterviewDetailPage />} />

          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  )
}


export default App
