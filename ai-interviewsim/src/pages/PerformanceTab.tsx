import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Spinner,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

// Performance metrics
const metrics = [
  "relevance",
  "clarity",
  "depth",
  "examples",
  "communication",
  "overall",
  "average_confidence",
  "average_focus",
];

// A list of chart colors
const chartColors = [
  "#3182CE", // blue
  "#E53E3E", // red
  "#38A169", // green
  "#D69E2E", // yellow
  "#805AD5", // purple
  "#DD6B20", // orange
  "#00B5D8", // cyan
  "#B83280", // pink
];

export default function PerformanceTab() {
  const [interviewData, setInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const bg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/interviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterviewData(res.data);
      } catch (err) {
        console.error("Failed to fetch interviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getChartData = (metric: string, index: number) => {
    const labels = interviewData.map((item) =>
      new Date(item.date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    const scores = interviewData.map((item) =>
      metric.startsWith("average_")
        ? parseFloat(item[metric] || 0)
        : parseFloat(item.feedback?.[metric] || 0)
    );

    return {
      labels,
      datasets: [
        {
          label: metric.replace(/_/g, " ").toUpperCase(),
          data: scores,
          fill: false,
          borderColor: chartColors[index % chartColors.length],
          backgroundColor: chartColors[index % chartColors.length],
          tension: 0.3,
        },
      ],
    };
  };

  if (loading) return <Spinner size="xl" mt={20} ml={20} />;

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Performance Trends
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {metrics.map((metric, index) => (
          <Box
            key={metric}
            bg={bg}
            p={4}
            borderRadius="md"
            boxShadow="md"
            minH="300px"
          >
            <Line data={getChartData(metric, index)} />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
