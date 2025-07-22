from pymongo import MongoClient
from dotenv import load_dotenv
import os
import certifi  # ✅ ensure certifi is used

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://rp520972:JOcn5mGd1Opec27Y@cluster0.i89hlpe.mongodb.net/?retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "ai_interviewsim")

# ✅ Use certifi for trusted TLS connection
client = MongoClient(MONGO_URL, tls=True, tlsCAFile=certifi.where())
db = client[DB_NAME]

# Collections
users_collection = db["users"]
interviews_collection = db["interviews"]



