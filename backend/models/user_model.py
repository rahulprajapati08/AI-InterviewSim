from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str

class ExperienceItem(BaseModel):
    title: str
    company: str
    duration: str
    description: str

class ProjectItem(BaseModel):
    title: str
    tech: List[str]
    description: str

class UserSchema(BaseModel):
    name: str
    email: EmailStr
    groq_api_key: Optional[str] = None
    password: str  # Hashed version
    phone: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    role: Optional[str] = ""
    skills: List[str] = []
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    createdAt: datetime = datetime.utcnow()
