import {
  Box, Heading, Text, SimpleGrid, VStack, Icon, Image, Button, Link
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaRobot, FaPython, FaDatabase, FaUserTie, FaLaptopCode, FaBrain } from 'react-icons/fa'

// Role-based content
const ROLE_CONTENT = {
  ds: {
    actions: [
      { label: "Learn to ace DS interviews", icon: FaBrain,url: "https://www.youtube.com/playlist?list=PLKnIA16_Rmva_ZdY31wpEICG0KHnvIhu2"},
      { label: "Practice Python coding", icon: FaPython , url:"https://www.hackerrank.com/"},
      { label: "Practice SQL coding", icon: FaDatabase,url:"https://www.hackerrank.com/" },
      { label: "Practice with an AI interviewer", icon: FaRobot, url: "/setup" },
    ],
    courses: [
      {
        title: "Data Science Interview Prep",
        img: "src/assets/ds.jpg",
       
        url: "https://www.youtube.com/playlist?list=PLKnIA16_Rmva_ZdY31wpEICG0KHnvIhu2"
      },
      {
        title: "SQL Course",
        img: "src/assets/sql.jpg",
        
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFbom4rYyl5qROgqYuCuAPD"
      },
    ]
  },

  sde: {
    actions: [
      { label: "Practice Coding", icon: FaLaptopCode, url: "https://leetcode.com" },
      { label: "Practice with an AI interviewer", icon: FaRobot, url: "/setup" },
      { label: "Practice System Design", icon: FaUserTie , url:"https://takeuforward.org/system-design/complete-system-design-roadmap-with-videos-for-sdes" },
      { label: "Revise DSA Concepts", icon: FaBrain , url:"https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems"},
    ],
    courses: [
      {
        title: "DSA Masterclass",
        img: "src/assets/dsa.jpg",
        
        url: "https://youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz&si=L4Cb-qENL7yi2Xch"
      },
      {
        title: "System Design Basics",
        img: "src/assets/system.jpg",
        
        url: "https://youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX&si=uO9-k-1ppgVYNEfw"
      },
    ]
  },

  frontend: {
    actions: [
      { label: "Master React", icon: FaLaptopCode , url:"https://react.dev/learn"},
      { label: "CSS & UI Challenges", icon: FaBrain , url: "https://frontendmentor.io/challenges" },
      { label: "Practice JavaScript Questions", icon: FaPython , url: "https://www.jschallenger.com/" },
      { label: "Frontend mock interview", icon: FaRobot, url: "/setup" },
    ],
    courses: [
      {
        title: "React Frontend Projects",
        img: "src/assets/react.jpg",
        lessons: 9,
        url: "https://youtu.be/5ZdHfJVAY-s?si=LI3WqBk2vlWkjDic"
      },
      {
        title: "Frontend Development Mastery",
        img: "src/assets/front.jpg",
        lessons: 11,
        url: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbmMuZ3saqRIBimAKIMYkt0E"
      },
    ]
  },

  backend: {
    actions: [
      { label: "Practice Backend Coding", icon: FaLaptopCode , url: "https://exercism.org/tracks/python" },
      { label: "Learn REST APIs & Auth", icon: FaBrain , url:"https://youtu.be/WXsD0ZgxjRw?si=gKlCKuYNW5JTbGqb" },
      { label: "Practice SQL and NoSQL", icon: FaDatabase , url: "https://www.freecodecamp.org/learn/relational-database/"
    },
      { label: "System Design for Backend", icon: FaUserTie ,url: "https://www.youtube.com/playlist?list=PLTCrU9sGyburBw9wNOHebv9SjlE4Elv5a" },
      { label: "Backend mock interview", icon: FaRobot, url: "/setup" },
    ],
    courses: [
      {
        title: "Backend Engineering with Node.js",
        img: "src/assets/back.jpg",
        lessons: 10,
        url: "https://www.youtube.com/playlist?list=PLbtI3_MArDOkXRLxdMt1NOMtCS-84ibHH"
      },
      {
        title: "Fullstack Web Development",
        img: "src/assets/full.jpg",
        lessons: 8,
        url: "https://www.youtube.com/playlist?list=PLDzeHZWIZsTo0wSBcg4-NMIbC0L8evLrD"
      },
    ]
  },
}


export default function HomeTab() {
  const [username, setUsername] = useState("User")
  const [role, setRole] = useState("ds") // fallback role

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = await res.json()
        setUsername((data.name) || "User")
        setRole(data.role?.toLowerCase() || "ds")
      } catch (error) {
        console.error("Failed to fetch user info", error)
      }
    }
    fetchUser()
  }, [])

  const roleData = ROLE_CONTENT[role] || ROLE_CONTENT.ds

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Welcome back, {username}!</Heading>
      <Text color="gray.600" mb={6}>
        Continue learning with our recommendations based on your career goals and recent activity.
      </Text>

      {/* Quick Actions */}
      <SimpleGrid columns={[1, 2, 3, 4]} spacing={4} mb={10}>
        {roleData.actions.map((item, i) => (
          <QuickAction key={i} icon={item.icon} label={item.label} url={item.url} />
        ))}
      </SimpleGrid>

      {/* Course Recommendations */}
      <SimpleGrid columns={[1, 2]} spacing={6}>
        {roleData.courses.map((item, i) => (
          <CourseCard key={i} title={item.title} img={item.img} lessons={item.lessons} url={item.url} />
        ))}
      </SimpleGrid>
    </Box>
  )
}

const QuickAction = ({ icon, label, url }: { icon: any, label: string, url?: string }) => {
  const content = (
    <VStack
      bg="gray.100"
      p={4}
      borderRadius="md"
      align="center"
      justify="center"
      spacing={2}
      _hover={{ bg: 'gray.200', cursor: 'pointer' }}
    >
      <Icon as={icon} boxSize={6} color="teal.500" />
      <Text fontSize="sm" fontWeight="medium" textAlign="center">{label}</Text>
    </VStack>
  )
  return url ? <Link href={url} isExternal>{content}</Link> : content
}

const CourseCard = ({ title, img, lessons, url }: { title: string, img: string, lessons: number, url: string }) => (
  <Box bg="white" borderRadius="md" boxShadow="md" overflow="hidden">
    <Image src={img} alt={title} objectFit="cover" height="150px" width="100%" />
    <Box p={4}>
      <Text fontSize="xs" color="gray.500" mb={1}>RECOMMENDED</Text>
      <Heading size="sm" mb={1}>{title}</Heading>
      
      <Link href={url} isExternal>
        <Button size="sm" colorScheme="purple" mt={3}>Start course</Button>
      </Link>
    </Box>
  </Box>
)
