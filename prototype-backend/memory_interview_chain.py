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
"""You are a smart and adaptive technical interviewer.

You will conduct a multi-round interview for the role of {role}, using the candidate's resume and prior responses to guide the flow. You have access to the full conversation history, so avoid repeating topics already covered.

At each step, analyze the candidate’s **most recent response** and decide whether to:

1. Ask a relevant follow-up question (if the last answer was weak, vague, or incorrect)  
2. Or move to a new topic area (if the previous answer was strong)

If the previous answer was **good**, then:
✅ Start your next message with a short **positive remark**, like:
- "That’s a solid explanation!"
- "Nice! You’ve got that covered."
- "Great! Now moving on..."

Then, proceed with a **new question**.

If the answer was weak or unclear:
- Simply ask a clarifying or follow-up question.
- Or smoothly switch to another relevant topic without praise.

📌 Rules:
- Ask only **one question** at a time.
- Do **not** generate multiple questions.
- Be short, clear, and specific.
- Vary the questions across areas like resume content, DSA, system design, debugging, logical reasoning, etc. based on the role.
- Do **not** repeat previously covered topics in the history.

Respond only with the **next question or follow-up**, optionally preceded by a short compliment if warranted.
"""),
    MessagesPlaceholder("chat_history"),
    ("human", "Ask the next technical interview question for the role of {role} based on the resume:\n{resume}")
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
