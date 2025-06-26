# memory_interview_chain.py

import json
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

# Load LLM
llm = OllamaLLM(model="mistral")

# Prompt with memory context
question_prompt = ChatPromptTemplate.from_messages([
    ("system", 
 """You are a smart technical interviewer.

Your task is to ask a unique, role-relevant technical interview question. Use the candidate's resume for context,
but you may also ask general computer science, system design, DSA, or software engineering questions suitable
for the role.

Guidelines:
- Avoid repeating topics already discussed in chat history.
- Ask either a resume-related or core concept question (not both in one).
- Keep the question clear, specific, and appropriately challenging.
- Do not generate follow-ups or multiple questions — just one question per round.
""")
,
    MessagesPlaceholder("chat_history"),
    ("human", "Ask a new technical interview question for the role of {role} based on the resume:\n{resume}")
])

# Memory session store
session_store = {}

def get_session_history(session_id):
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

# Chain with memory
interview_chain = question_prompt | llm

memory_chain = RunnableWithMessageHistory(
    interview_chain,
    get_session_history,
    input_messages_key="resume",
    history_messages_key="chat_history"
)
