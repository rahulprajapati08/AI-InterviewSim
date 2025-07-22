# hr_interview_chain.py

#from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

#llm = OllamaLLM(model="mistral")
from llm_groq_config import llm
# HR-style prompt
hr_prompt = ChatPromptTemplate.from_messages([
    ("system", 
"""You are a human resources interviewer conducting a behavioral interview for the role of {role}.

Your job is to ask **one** realistic HR-style question at a time. Questions should focus on:
- communication
- self-awareness
- teamwork
- leadership
- emotional intelligence

📌 Very important:
- Ask **only** the question — do not add explanations or context.
- Do **not** start with phrases like "Here's a question" or "Sure!" — just ask the question directly.
- Use a professional tone, but sound natural.

Use the chat history to avoid repeating areas already covered.

"""),
    MessagesPlaceholder("chat_history"),
    ("human", "Ask the next HR/behavioral interview question for the role of {role}.")
])

# Session store
hr_session_store = {}

def get_hr_session_history(session_id):
    if session_id not in hr_session_store:
        hr_session_store[session_id] = ChatMessageHistory()
    return hr_session_store[session_id]

# Memory-based chain
hr_chain = hr_prompt | llm

hr_memory_chain = RunnableWithMessageHistory(
    hr_chain,
    get_hr_session_history,
    input_messages_key="role",
    history_messages_key="chat_history"
)
