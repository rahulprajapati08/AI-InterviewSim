

import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()




GROQ_API_KEY = os.getenv("DEFAULT_GROQ_API_KEY")

llm = ChatGroq(groq_api_key=GROQ_API_KEY, model="llama3-8b-8192")
code_llm = ChatGroq(groq_api_key=GROQ_API_KEY , model="llama3-70b-8192")
