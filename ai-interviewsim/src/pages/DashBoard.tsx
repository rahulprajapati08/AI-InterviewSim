// Dashboard.tsx

import {
  Box, Flex, Tabs, TabList, TabPanels, Tab, TabPanel,
  SimpleGrid, Heading, Text, Button, Image,
  Collapse, useDisclosure, VStack,Spinner
} from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp, FaUserEdit, FaSignOutAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import logoImage from '../assets/logo.png';
import HomeTab from "../components/HomeTab";
import PerformanceTab from "./PerformanceTab";

const Dashboard = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const { isOpen, onToggle } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/interviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterviews(res.data.reverse());
      } catch (err) {
        console.error("Failed to fetch interviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading)  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#f5f8ff">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        
      </VStack>
    </Box>
  );

  return (
    <Flex height="100vh">
      {/* Sidebar */}
      <Box
        w="250px"
        bg="#00203c"
        color="white"
        p={6}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box>
          <Image src={logoImage} alt="AI InterviewSim" mb={10} mx="auto" width="160px" />

          <Tabs
            orientation="vertical"
            variant="unstyled"
            index={tabIndex}
            onChange={setTabIndex}
          >
            <TabList display="flex" flexDirection="column" gap={4}>
              <Tab
                _selected={{ bg: "teal.400", color: "white" }}
                _hover={{ bg: "teal.500" }}
                py={2}
                borderRadius="md"
                textAlign="left"
              >
                Home
              </Tab>

              <Tab
                _selected={{ bg: "teal.400", color: "white" }}
                _hover={{ bg: "teal.500" }}
                py={2}
                borderRadius="md"
                textAlign="left"
              >
                Interview History
              </Tab>

              <Tab
                _selected={{ bg: "teal.400", color: "white" }}
                _hover={{ bg: "teal.500" }}
                py={2}
                borderRadius="md"
                textAlign="left"
              >
                Performance
              </Tab>

              {/* Settings Dropdown */}
              <Box onClick={onToggle} cursor="pointer">
                <Flex
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="md"
                  _hover={{ bg: "teal.500" }}
                  //bg="teal.600"
                >
                  <Text>Settings</Text>
                  {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </Flex>
              </Box>

              <Collapse in={isOpen} animateOpacity>
                <VStack align="stretch" spacing={2} mt={2} pl={2}>
                  <Button
                    as={RouterLink}
                    to="/profile-setup"
                    leftIcon={<FaUserEdit />}
                    colorScheme="teal"
                    variant="ghost"
                    justifyContent="start"
                    size="sm"
                  >
                    Update Profile
                  </Button>

                  <Button
                    onClick={handleLogout}
                    leftIcon={<FaSignOutAlt />}
                    colorScheme="red"
                    variant="ghost"
                    justifyContent="start"
                    size="sm"
                  >
                    Logout
                  </Button>
                </VStack>
              </Collapse>
            </TabList>
          </Tabs>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} overflowY="auto">
        <Tabs index={tabIndex} onChange={setTabIndex} isManual>
          <TabPanels>
            {/* Home */}
            <TabPanel>
              <HomeTab />
            </TabPanel>

            {/* Interview History */}
            <TabPanel>
              <Heading size="lg" mb={6} color="#00203c">
                Your Interview History
              </Heading>

              {interviews.length === 0 ? (
                <Text color="gray.500">No interviews found. Start your first AI interview simulation!</Text>
              ) : (
                <SimpleGrid columns={[1, null, 2]} spacing={6}>
                  {interviews.map((item) => (
                    <RouterLink to={`/interview/${item._id}`} key={item._id}>
                      <Box
                        bg="white"
                        border="1px solid #e2e8f0"
                        borderRadius="lg"
                        boxShadow="sm"
                        p={5}
                        transition="all 0.2s ease-in-out"
                        _hover={{ boxShadow: "lg", transform: "translateY(-4px)", cursor: "pointer" }}
                      >
                        <Heading size="md" color="#00203c" mb={2}>
                          {item.role?.toUpperCase()} – {item.mode?.toUpperCase()}
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          {new Date(item.date).toLocaleString()}
                        </Text>
                        <Button size="sm" colorScheme="teal" variant="outline">
                          View Full Feedback
                        </Button>
                      </Box>
                    </RouterLink>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Performance */}
            <TabPanel>
              <PerformanceTab interviewData={interviews} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
};

export default Dashboard;
