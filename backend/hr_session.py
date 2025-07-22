# backend/hr_session.py

from hr_interview_chain import hr_memory_chain
from feedback_utils import generate_hr_feedback

class HRInterviewSession:
    def __init__(self, role, session_id, rounds=3):
        self.role = role
        self.session_id = session_id
        self.current_round = 0
        self.rounds = rounds
        self.meta = {} 
        self.round_type = "HR"
        self.history = [{"question": "Welcome to the HR round of your interview. Tell me about your strengths and weaknesses.", "answer": None}]

    def ask_question(self):
        if self.current_round >= self.rounds:
            return None

        question = hr_memory_chain.invoke(
            {"role": self.role},
            config={"configurable": {"session_id": self.session_id}}
        ).content

        self.history.append({"question": question, "answer": None})
        self.current_round += 1
        return question

    def provide_answer(self, answer):
        if self.history:
            self.history[-1]["answer"] = answer

    def generate_feedback(self):
        return generate_hr_feedback(self.history)
