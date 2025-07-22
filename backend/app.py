from fastapi import FastAPI, File, UploadFile, Form , Depends, HTTPException , Header , Request , APIRouter , Body
from models.user_model import UserSchema
from database import users_collection , interviews_collection
from datetime import datetime
from pydantic import BaseModel
from auth import hash_password, verify_password, create_access_token, fake_db , SECRET_KEY, ALGORITHM , get_current_user
from pymongo.errors import DuplicateKeyError
from fastapi.middleware.cors import CORSMiddleware
from interview_session import InterviewSession
from resume_parser import parse_resume_with_llm
from coding_session import CodingSession
from speech_to_text import transcribe
from jose import jwt, JWTError
from langchain_ollama import OllamaLLM
from uuid import uuid4
from interview_session import InterviewSession
from confidence_utils import get_confidence_score
from typing import Optional
from bson import ObjectId

import json
import numpy as np
from hr_session import HRInterviewSession
from auth import get_current_user
from routes.user import router as user_router

from langchain_core.prompts import PromptTemplate
import tempfile


app = FastAPI()
user_sessions = {}

router = APIRouter()
app.include_router(user_router)
# CORS setup so frontend can call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserAuth(BaseModel):
    email: str
    password: str

class CodeSubmission(BaseModel):
    code: str







@app.post("/api/setup")
def setup_session(
    role: str = Form(...),
    interview_type: str = Form(...),
    custom_round: str = Form(''),
    user: str = Depends(get_current_user)
):
    session_id = str(uuid4())

    # 🔁 Load parsed resume text from DB
    user_data = users_collection.find_one({"email": user})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    resume = {
        "name": user_data.get("name"),
        "email": user_data.get("email"),
        "phone": user_data.get("phone"),
        "skills": user_data.get("skills", []),
        "projects": user_data.get("projects", []),
        "experience": user_data.get("experience", [])
    }

    # Convert to structured text
    resume_text = "\n".join([
    f"Name: {resume.get('name')}",
    f"Email: {resume.get('email')}",
    f"Phone: {resume.get('phone')}",
    "Skills: " + ", ".join(resume.get('skills', [])),
    "Projects: " + ", ".join(resume.get("projects", [])),  # no .get() here
    "Experience: " + ", ".join(resume.get("experience", []))  # no .get() here
])



    if interview_type == "full":
        session_data = {
            "mode": "full",
            "tech": InterviewSession(role=role, resume_obj=resume_text, rounds=2, session_id=session_id),
            "hr": HRInterviewSession(role=role, rounds=2, session_id=session_id + "_hr"),
            "current": "tech",
            "role":role
        }

        # ⛔ Skip coding round for frontend roles
        if role.lower() != "frontend developer":
            session_data["code"] = CodingSession(role=role, rounds=3)

        user_sessions[user] = session_data
    elif custom_round == "technical":
        user_sessions[user] = InterviewSession(role=role, resume_obj=resume_text, rounds=1, session_id=session_id)
    elif custom_round == "behavioral":
        user_sessions[user] = HRInterviewSession(role=role, rounds=1, session_id=session_id)
    elif custom_round == "coding":
        user_sessions[user] = CodingSession(role=role, rounds=3)
    else:
        raise HTTPException(status_code=400, detail="Invalid round type")
    
    return {"session_id": session_id}



@app.post("/api/signup")
def signup(user: UserAuth):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = hash_password(user.password)

    users_collection.insert_one({
        "email": user.email,
        "password": hashed_pw,
        "createdAt": datetime.utcnow()
    })

    return {"msg": "User registered successfully"}


@app.post("/api/login")
def login(user: UserAuth):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token}

@app.post("/api/parse-resume")
async def parse_resume_endpoint(resume: UploadFile = File(...), user: str = Depends(get_current_user)):
    import tempfile
    from resume_parser import parse_resume_with_llm

    # Save resume to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        contents = await resume.read()
        tmp.write(contents)
        tmp_path = tmp.name

    result = parse_resume_with_llm(tmp_path)

    if "error" in result:
        raise HTTPException(status_code=400, detail="Resume parsing failed")

    return result



# Global interview session (you can make this per-user later)
'''session = InterviewSession(
    resume_path="Rahul_Resume_provisional__parsed.json",
    role="Software Development Engineer",
    rounds=1
)
'''
import os
@app.post("/api/audio")
async def handle_audio(audio: UploadFile = File(...), focus_score: Optional[float] = Form(1.0), user: str = Depends(get_current_user)):
    session_info = user_sessions.get(user)

    if not session_info:
        raise HTTPException(status_code=404, detail="No active session")

    # Save audio
    contents = await audio.read()
    tmp_path = f"temp_{uuid4().hex}.wav"
    with open(tmp_path, "wb") as f:
        f.write(contents)

    answer = transcribe(tmp_path)
    confidence = get_confidence_score(tmp_path)
    os.remove(tmp_path)
    # Get the current session object
    if isinstance(session_info, dict):
        session = session_info.get(session_info.get("current"))
    else:
        session = session_info

    # Ensure session.meta exists
    if not hasattr(session, "meta") or session.meta is None:
        session.meta = {}

    # Add metrics
    session.meta.setdefault("confidence_scores", []).append(confidence)
    session.meta.setdefault("focus_scores", []).append(focus_score)

    # FULL INTERVIEW MODE
    if isinstance(session_info, dict):
        current_round = session_info["current"]
        session = session_info[current_round]

        
        # First-time greeting
        if not session.history and not session.meta.get("greeting_sent"):
            session.meta["greeting_sent"] = True

            # If user already spoke something (i.e., this is not just ping for first question)
            if answer.strip():
                session.provide_answer(answer)
                next_q = session.ask_question()
                return {"text": next_q, "answer": answer, "confidence": confidence}
            
            # Otherwise, greet first
            first_question = session.ask_question()
            return {"text": first_question, "answer": "", "confidence": confidence}

        # Process answer
        session.provide_answer(answer)
        next_q = session.ask_question()

        if next_q:
            return {"text": next_q, "answer": answer, "confidence": confidence}
        else:
            # Switch rounds
            if current_round == "tech":
                if "frontend" in session_info["role"].lower():

                    session_info["current"] = "hr"
                    return {"text": "Awesome. Now let’s start the behavioral (HR) round.", "answer": answer, "confidence": confidence}

                session_info["current"] = "code"
                return {"text": "Okay! Now let’s move to the live coding round.", "answer": answer, "confidence": confidence}
            elif current_round == "code":
                session_info["current"] = "hr"
                return {"text": "Okay. Now let’s start the behavioral (HR) round. Tell me about your Strengths and Weaknesses?", "answer": answer, "confidence": confidence}
            else:
                return {"text": "The interview is complete. Thank you!", "answer": answer, "confidence": confidence}

    # SINGLE ROUND MODE
    else:
        session = session_info

        # First-time greeting
        
        if not session.history and not session.meta.get("greeting_sent"):
            session.meta["greeting_sent"] = True

            # If user already spoke something (i.e., this is not just ping for first question)
            if answer.strip():
                session.provide_answer(answer)
                next_q = session.ask_question()
                return {"text": next_q, "answer": answer, "confidence": confidence}
            
            # Otherwise, greet first
            first_question = session.ask_question()
            return {"text": first_question, "answer": "", "confidence": confidence}

        # Process answer
        session.provide_answer(answer)
        next_q = session.ask_question()

        if next_q:
            return {"text": next_q, "answer": answer, "confidence": confidence}
        else:
            return {"text": "The interview is complete. Thank you!", "answer": answer, "confidence": confidence}



from datetime import datetime

@app.get("/api/feedback")
def get_feedback(user: str = Depends(get_current_user)):
    session_info = user_sessions.get(user)

    if not session_info:
        raise HTTPException(status_code=404, detail="No active session")

    feedback_data = {}
    transcript_data = ""

    # Get current session for flag tracking
    session = session_info if not isinstance(session_info, dict) else session_info.get(session_info["current"])
    if not hasattr(session, "meta") or session.meta is None:
        session.meta = {}

    if isinstance(session_info, dict) and session_info.get("mode") == "full":
        tech_fb = session_info["tech"].generate_feedback()
        hr_fb = session_info["hr"].generate_feedback()

        feedback_data = {
            "technical": tech_fb,
            "behavioral": hr_fb
        }

        if "code" in session_info:
            code_fb = session_info["code"].generate_feedback()
            feedback_data["coding"] = code_fb

        transcript_data = "\n".join([
            f"Q: {q['question']}\nA: {q['answer']}"
            for q in session_info["tech"].history + session_info["hr"].history
        ])


    else:
        summary = session.generate_feedback()
        feedback_data = json.loads(summary) if isinstance(summary, str) else summary

        transcript_data = "\n".join([
            f"Q: {q['question']}\nA: {q['answer']}"
            for q in session.history
        ])

    # Collect average metrics
    if isinstance(session_info, dict):
        all_conf, all_focus = [], []
        for key in ["tech", "hr"]:
            scores = getattr(session_info[key], "meta", {})
            all_conf += scores.get("confidence_scores", [])
            all_focus += scores.get("focus_scores", [])
        avg_conf = float(np.mean(all_conf)) if all_conf else 0.0
        avg_focus = float(np.mean(all_focus)) if all_focus else 0.0
    else:
        avg_conf = float(np.mean(session.meta.get("confidence_scores", [])))
        avg_focus = float(np.mean(session.meta.get("focus_scores", [])))

    # ✅ PREVENT DUPLICATE SAVES
    if not session.meta.get("feedback_saved"):
        interviews_collection.insert_one({
            "userId": user,
            "role": session_info["tech"].role if isinstance(session_info, dict) else session.role,
            "date": datetime.now().isoformat(),
            "mode": session_info["mode"] if isinstance(session_info, dict) else getattr(session_info, "round_type", "custom"),
            "transcript": transcript_data,
            "feedback": feedback_data,
            "average_confidence": avg_conf,
            "average_focus": avg_focus
        })
        session.meta["feedback_saved"] = True  # 🟢 Mark as saved
    else:
        print("🛑 Feedback already saved. Skipping DB insert.")

    return {
        **feedback_data,
        "average_confidence": avg_conf,
        "average_focus": avg_focus,
    }




@app.get("/api/coding-problem")
def get_coding_problem(user: str = Depends(get_current_user)):
    session_info = user_sessions.get(user)

    if not session_info:
        raise HTTPException(status_code=404, detail="No active session found.")
    

    # Full interview mode
    if isinstance(session_info, dict) and session_info.get("mode") == "full":
        # ❌ prevent accessing coding round too early
        if session_info.get("current") != "code":
            raise HTTPException(status_code=400, detail="Not in coding round yet.")

        # ✅ lazy init if not already created
        if "code" not in session_info:
            session_info["code"] = CodingSession(role=session_info["tech"].role, rounds=3)

        session = session_info["code"]

    elif isinstance(session_info, CodingSession):
        session = session_info

    else:
        raise HTTPException(status_code=400, detail="No coding session active.")
    print("Coding round index:", session.current_round, "/", session.rounds)

    problem = session.get_next_problem()
    if not problem:
        raise HTTPException(status_code=204, detail="No more coding problems.")

    return problem






@app.post("/api/submit-code")
async def submit_code(request: Request, user: str = Depends(get_current_user)):
    data = await request.json()
    code = data.get("code")

    session_info = user_sessions.get(user)
    if not session_info:
        raise HTTPException(status_code=404, detail="No active session")

    if isinstance(session_info, dict) and session_info.get("mode") == "full":
        session = session_info.get("code")
        session.submit_solution(code)

        # Fetch next problem
        next_problem = session.get_next_problem()
        if next_problem:
            return { "next": True, "problem": next_problem }

        # No more problems, switch to HR
        session_info["current"] = "hr"
        return {
            "next": False,
            "message": "Coding round complete. Moving to HR."
        }

    elif isinstance(session_info, CodingSession):
        session_info.submit_solution(code)
        return { "next": False, "message": "Thanks for your submission." }

    else:
        raise HTTPException(status_code=400, detail="Invalid coding session")


def get_average(scores: list[float]) -> float:
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 2)

from langchain_core.prompts import ChatPromptTemplate
from llm_groq_config import code_llm
@app.post("/api/code-explanation")
async def handle_code_explanation(audio: UploadFile = File(...), user: str = Depends(get_current_user)):
    session_info = user_sessions.get(user)

    if not session_info:
        raise HTTPException(status_code=404, detail="No session")

    # 🎯 Get CodingSession
    if isinstance(session_info, dict) and session_info.get("mode") == "full":
        session = session_info.get("code")
    elif isinstance(session_info, CodingSession):
        session = session_info
    else:
        raise HTTPException(status_code=400, detail="Not in coding session")

    # 🎤 Save and transcribe audio
    contents = await audio.read()
    tmp_path = f"temp_explain_{uuid4().hex}.wav"
    with open(tmp_path, "wb") as f:
        f.write(contents)

    user_text = transcribe(tmp_path)
    os.remove(tmp_path)

    # 🧠 Use LLM to respond to explanation
    session.explanation_history.append({"user": user_text})

    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    messages = [
        SystemMessage(content="You're a friendly technical recruiter conducting a coding interview. You have access to the problem, the candidate's code, and the ongoing explanation conversation."),
        HumanMessage(content="Problem:\n" + json.dumps(session.history[-1]["problem"], indent=2)),
        HumanMessage(content="Code:\n" + session.history[-1]["code"]),
    ]

    # Add chat history
    for msg in session.explanation_history:
        if "user" in msg:
            messages.append(HumanMessage(content=msg["user"]))
        elif "ai" in msg:
            messages.append(AIMessage(content=msg["ai"]))

    response = code_llm.invoke(messages).content



    # 💾 Save AI response back to explanation history
    session.explanation_history.append({"ai": response})

    return {
        "user_text": user_text,
        "response": response
    }


@app.get("/api/interviews")
def get_user_interviews(user: str = Depends(get_current_user)):
    interviews = list(interviews_collection.find({"userId": user}))
    for i in interviews:
        i["_id"] = str(i["_id"])  # Convert ObjectId to string for frontend
    return interviews

@app.get("/api/interviews/{interview_id}")
def get_interview(interview_id: str, user: str = Depends(get_current_user)):
    interview = interviews_collection.find_one({"_id": ObjectId(interview_id), "userId": user})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview["_id"] = str(interview["_id"])  # convert ObjectId to string
    return interview


@app.get("/api/history")
def get_history(user: str = Depends(get_current_user)):
    session = user_sessions.get(user)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if isinstance(session, dict):  # full session (tech + hr + coding)
        current_round = session.get(session['current'])
        history = current_round.history if current_round else []
    else:
        history = session.history

    return {"history": history}
