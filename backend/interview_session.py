import json 
import re
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))




from vector_memory import VectorMemory
from memory_interview_chain import memory_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage , SystemMessage
from langchain_ollama import ChatOllama
from llm_groq_config import llm


class InterviewSession:
  def __init__(self, resume_path=None, resume_obj=None, role='', rounds=3, session_id='default_user'):
      if resume_path:
          with open(resume_path, 'r', encoding='utf-8') as f:
              self.resume = json.load(f)
      elif resume_obj:
          self.resume = resume_obj
      else:
          raise ValueError("Either resume_path or resume_obj must be provided.")
      
      self.role = role
      self.resume_str = json.dumps(self.resume)
      self.rounds = rounds
      self.current_round = 0
      self.meta = {} 
      self.round_type = "Technical" 
      self.session_id = session_id
      self.vector_memory = VectorMemory()
      self.history = [{'question': "Welcome to The Technical round of your Interview. How are You?", 'answer': None}]
      self.final_feedback = {}
      self.final_attention = 0


  def ask_question(self):
    if self.current_round >= self.rounds:
        return None
    
    
    question = memory_chain.invoke(
        {
            'resume': self.resume_str,
            'role': self.role
        },
        config={'configurable': {'session_id': self.session_id}}
    ).content
    
    # Append immediately (no duplicate checking)
    self.history.append({'question': question, 'answer': None})
    
    
    

    return question


  
  def provide_answer(self, answer ):
    q = self.history[-1]['question']
    self.history[-1]['answer'] = answer
    self.vector_memory.add_qa(q, answer)
    self.current_round += 1
    

    
  def is_complete(self):
    return self.current_round >=self.rounds
  
  def summary(self):
    return self.history
  
  def generate_feedback(self):
    qa_summary = ""

    for i, qa in enumerate(self.history, 1):
        qa_summary += f"Q{i} : {qa['question']}\nA{i} : {qa['answer']}\n\n"

    feedback_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert mock interview evaluator.

Based on the candidate's full interview responses, analyze and score them across the following parameters:

- Relevance to the questions
- Clarity of explanation
- Depth of knowledge
- Use of real-world examples
- Communication & confidence
- Overall score (out of 5)

Return a JSON object like this:

{{
  "relevance": 4.5,
  "clarity": 4.0,
  "depth": 3.5,
  "examples": 3.0,
  "communication": 4.2,
  "overall": 4.1,
  "summary": "You communicated clearly and provided relevant answers. Your confidence and clarity were strong. Keep improving technical depth and add richer examples."
}}"""),
        ("human", "{qa_summary}")
    ])

    chain = feedback_prompt | llm

    raw = chain.invoke({"qa_summary": qa_summary})
    raw_text = getattr(raw, "content", str(raw))

    # Replace invalid JSON literals
    raw_text = raw_text.replace("N/A", "null")  # or use '"N/A"' if you prefer keeping it as a string

    try:
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        parsed = json.loads(json_match.group(0)) if json_match else {}
    except Exception as e:
        parsed = {"error": f"Could not parse feedback: {str(e)}"}

    return parsed
