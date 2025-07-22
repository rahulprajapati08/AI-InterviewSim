# backend/coding_session.py
import random
import json
from feedback_utils import generate_coding_feedback  # We'll add this next

class CodingSession:
    def __init__(self, role, rounds=2):
        self.role = role
        self.current_round = 0
        self.rounds = rounds
        self.history = []
        self.explanation_history = []
        self.meta = {} 
        self.round_type = "Coding" 

        # Define basic coding problems
        # 🔹 Load all problems from a JSON file
        with open("problems.json", "r") as f:
            self.all_problems = json.load(f)

        # 🔀 Shuffle to randomize order and avoid repeat
        self.randomized_problems = random.sample(self.all_problems, len(self.all_problems))

    def get_next_problem(self):
        print(f"[DEBUG] CodingSession: round {self.current_round} / {self.rounds}")
        if self.current_round >= self.rounds or self.current_round >= len(self.randomized_problems):
            return None

        problem = self.randomized_problems[self.current_round]
        self.current_round += 1
        self.history.append({ "problem": problem, "code": "" })
        return problem

    def submit_solution(self, code: str):
        if self.history:
            self.history[-1]["code"] = code

    def generate_feedback(self):
        return generate_coding_feedback(self.history)
