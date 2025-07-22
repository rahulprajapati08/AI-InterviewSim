import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  Heading,
  Textarea,
  VStack,
  useToast,
  Spinner,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'

const ProfileSetup = () => {
  const toast = useToast();
  const navigate = useNavigate()
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    skills: "",
    projects: "",
    experience: "",
    education: "",
    role: "",
  });

  const handleResumeUpload = async () => {
    if (!resumeFile) return;

    setLoading(true);
    const form = new FormData();
    form.append("resume", resumeFile);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/parse-resume", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed = res.data;

      setFormData((prev: any) => ({
        ...prev,
        name: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        linkedin: parsed.linkedin || "",
        github: parsed.github || "",
        skills: parsed.skills?.join(", ") || "",
        projects: parsed.projects?.map((p: any) => p.title).join(", ") || "",
        experience: parsed.experience?.map((e: any) => e.title).join(", ") || "",
        education: parsed.education?.map((e: any) => e.degree).join(", ") || "",
      }));

      toast({ title: "Resume parsed successfully!", status: "success" });
    } catch (err) {
      toast({ title: "Failed to parse resume", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/profile-setup", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({ title: "Profile setup complete!", status: "success" });
      navigate("/dashboard")
    } catch (err) {
      toast({ title: "Failed to submit profile", status: "error" });
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFormData((prev: any) => ({
          ...prev,
          ...res.data,
        }));
      } catch (err) {
        console.log("Profile not found or error occurred");
      }
    };

    fetchProfile();
  }, []);

  const cardBg = useColorModeValue("white", "gray.800")

  return (
    <Box maxW="600px" mx="auto" mt={8} p={8} borderRadius="md" boxShadow="md" bg={cardBg}>
      <Heading size="lg" mb={6} textAlign="center" color="teal.500">Complete Your Profile</Heading>

      <FormControl mb={6}>
        <FormLabel fontWeight="medium">Upload Resume (PDF)</FormLabel>
        <Input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
        <Button onClick={handleResumeUpload} mt={2} isLoading={loading} colorScheme="teal">
          Parse Resume
        </Button>
      </FormControl>

      {loading ? (
        <Spinner size="xl" mt={6} />
      ) : (
        <VStack spacing={4} align="stretch">
          {/* Add dropdown for Role */}
          <FormControl>
            <FormLabel fontWeight="medium">Role</FormLabel>
            <Select name="role" value={formData.role} onChange={handleInputChange} placeholder="Select your role">
              <option value="sde">SDE</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="ds">Data Scientist</option>
              
            </Select>
          </FormControl>

          {/* Other Fields */}
          {["name", "email", "phone", "linkedin", "github", "skills", "projects", "experience", "education"].map((field) => (
            <FormControl key={field}>
              <FormLabel fontWeight="medium">{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
              {["skills", "projects", "experience", "education"].includes(field) ? (
                <Textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  placeholder={`Comma-separated ${field}`}
                />
              ) : (
                <Input name={field} value={formData[field]} onChange={handleInputChange} />
              )}
            </FormControl>
          ))}

          <Button colorScheme="teal" onClick={handleSubmit} mt={4}>Submit Profile</Button>
        </VStack>
      )}
    </Box>
  );
};

export default ProfileSetup;
