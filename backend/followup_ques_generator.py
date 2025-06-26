from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

llm = OllamaLLM(model='mistral')

template = """
You are a professional interview assistant. A candidate has just answered a question in an interview.

Analyze the answer and determine:
- Is it incomplete, unclear, or worth digging deeper into?
- If yes, generate a follow-up question.
- If no, simply reply with: "No follow-up needed. Proceed to next question."

Candidate's Answer:
"{answer}"

Role: {role}

Respond with only the follow-up question or "No follow-up needed. Proceed to next question."
"""

prompt = PromptTemplate(
  input_variables=['answer','role'],
  template=template
)

followup_chain = prompt | llm

def generate_followup(answer,role='Software Developer'):
  response = followup_chain.invoke({'answer':answer , 'role':role})
  return response.strip()

if __name__=='__main__':
  user_answer = """
    I used XGBoost for building the air quality prediction model because it handles missing values well.
    The biggest challenge was cleaning inconsistent data formats, and I used pandas and NumPy to preprocess it.
    """
  role = "Machine Learning Engineer"

  print('Evaluating the answer')
  followup=generate_followup(user_answer,role)
  print(f"\n🧠 Follow-Up:\n{followup}")
  