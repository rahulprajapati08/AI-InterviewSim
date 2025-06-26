import json 
import re
from interview_ques_generator import generate_question
from followup_ques_generator import generate_followup
from vector_memory import VectorMemory
from memory_interview_chain import memory_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage , SystemMessage
from langchain_ollama import ChatOllama


class InterviewSession:
  def __init__(self , resume_path,role , rounds=3 , session_id='default_user'):
    with open(resume_path,'r',encoding='utf-8') as f:
      self.resume=json.load(f)
    self.role=role
    self.resume_str = json.dumps(self.resume)
    self.rounds=rounds
    self.current_round = 0
    self.session_id = session_id
    self.vector_memory = VectorMemory()
    self.history = []
    self.final_feedback = {}

  def ask_question(self):
    if self.current_round >= self.rounds:
        return None

    question = memory_chain.invoke(
        {
            'resume': self.resume_str,
            'role': self.role
        },
        config={'configurable': {'session_id': self.session_id}}
    ).strip()

    # Append immediately (no duplicate checking)
    self.history.append({'question': question, 'answer': None, 'followup': None})
    return question


  
  def provide_answer(self, answer ):
    q = self.history[-1]['question']
    self.history[-1]['answer'] = answer
    self.vector_memory.add_qa(q, answer)
    self.current_round += 1
    

  def get_followup(self, answer):
      # Optional: Only generate followup if needed
      followup = generate_followup(answer, self.role)
      if "No follow-up" not in followup:
          self.history[-1]['followup'] = followup
          return followup
      return None
    
  def is_complete(self):
    return self.current_round >=self.rounds
  
  def summary(self):
    return self.history
  
  def generate_final_feedback(self):
    qa_summary=""
    
    for i , qa in enumerate(self.history,1):
        qa_summary+=f"Q{i} : {qa['question']}\nA{i} : {qa['answer']}\n\n"

    feedback_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert mock interview evaluator.

Based on the candidate's full interview responses below, analyze and score them across the following parameters:

- Relevance to the questions
- Clarity of explanation
- Depth of knowledge
- Use of real-world examples
- Communication & confidence
- Overall score (out of 5)

Return a JSON object like this (DO NOT include any explanation or formatting):

{{
  "relevance": 4.5,
  "clarity": 4.0,
  "depth": 3.5,
  "examples": 3.0,
  "communication": 4.2,
  "overall": 4.1,
  "summary": "You communicated clearly and provided relevant answers. However, your depth on technical subjects and use of concrete examples could be improved."
}}
        """),
        ("human", "{qa_summary}")
    ])

    chain = feedback_prompt | ChatOllama(model="mistral")  # or llama3/gemma3 as you use
    raw = chain.invoke({"qa_summary": qa_summary})
    
    try:
        json_match = re.search(r"\{.*\}", raw.content, re.DOTALL)
        parsed = json.loads(json_match.group(0)) if json_match else {}
    except:
        parsed = {"error": "Could not parse feedback."}

    self.final_feedback = parsed