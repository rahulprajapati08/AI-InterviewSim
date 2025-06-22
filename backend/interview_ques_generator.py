import json
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

def load_resume(file_path):
  with open(file_path , 'r' , encoding='utf-8') as f:
    data = json.load(f)
  return data

llm = OllamaLLM(model='mistral')

prompt_template = """
You are a technical interviewer. Based on the candidate's resume and selected job role, generate the first interview question.

Candidate Resume (in JSON format):
{resume}

Target Role: {role}

Rules:
- Ask one clear and relevant interview question.
- Tailor it to the skills, experience, or projects in the resume.
- Do not provide explanations or answers.

Return only the question.
"""

prompt = PromptTemplate(
  input_variables=['resume','role'],
  template=prompt_template
)

interview_chain = prompt | llm

def generate_question(resume_path , role):
  resume_data = load_resume(resume_path)
  resume_str = json.dumps(resume_data)

  question = interview_chain.invoke({'resume':resume_str , 'role':role})

  return question.strip()

if __name__=='__main__':
  resume_path = 'test-files/Rahul_Resume_provisional__parsed.json'
  role = 'Software Development Engineer'

  print("Generating Questions....")
  question = generate_question(resume_path,role)
  print(f'\n Interview Questiion :\n{question}')