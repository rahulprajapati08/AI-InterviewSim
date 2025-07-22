from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
import json
from llm_groq_config import llm , code_llm
# You can tune these as needed
#llm = OllamaLLM(model='mistral', temperature=0.7)
#code_llm = OllamaLLM(model='codellama')

def generate_hr_feedback(history):
    transcript = "\n".join(
        [f"Q: {item['question']}\nA: {item['answer']}" for item in history if item['answer']]
    )

    prompt = PromptTemplate(
        input_variables=["transcript"],
        template="""
You are an expert HR recruiter. Evaluate the following behavioral interview transcript:

{transcript}

Based on the candidate's responses, score them across:

- Relevance to the questions
- Clarity of explanation
- Depth of knowledge
- Use of real-world examples
- Communication & confidence
- Overall impression

Respond **only** with a well-formatted JSON object like this:

{{
  "relevance": 4.5,
  "clarity": 4.0,
  "depth": 3.5,
  "examples": 3.0,
  "communication": 4.2,
  "overall": 4.1,
  "summary": "Your answers were clear and relevant, with good communication. You could deepen your examples for impact."
}}
"""
    )

    chain = prompt | llm
    raw_output = chain.invoke({"transcript": transcript}).content

    # Try parsing the response into JSON
    try:
        feedback = json.loads(raw_output)
    except Exception as e:
        feedback = {
            "relevance": 0,
            "clarity": 0,
            "depth": 0,
            "examples": 0,
            "communication": 0,
            "overall": 0,
            "summary": "Feedback generation failed. Please retry or check LLM response."
        }

    return feedback

def generate_coding_feedback(history):
    # Take last submitted solution
    latest = history[-1] if history else {}

    problem = latest.get("problem", {})
    code = latest.get("code", "")

    prompt = PromptTemplate(
        input_variables=["description", "function_signature", "code"],
        template="""
You are a senior software engineer evaluating a candidate's coding submission.

Problem:
{description}

Function Signature:
{function_signature}

Candidate's Code:
{code}

Evaluate the solution on:

- Correctness
- Code clarity
- Edge case handling
- Time & space complexity
- Overall quality (0 to 5)

Respond only with a JSON object like:

{{
  "correctness": 4.5,
  "clarity": 4.2,
  "edge_cases": 3.8,
  "efficiency": 4.0,
  "overall": 4.1,
  "summary": "The code solves the problem and is mostly clean. Could improve edge case handling and comments."
}}
"""
    )

    chain = prompt | code_llm
    raw_output = chain.invoke({
        "description": problem.get("description", ""),
        "function_signature": problem.get("function_signature", ""),
        "code": code
    }).content

    try:
        return json.loads(raw_output)
    except Exception:
        return {
            "correctness": 0,
            "clarity": 0,
            "edge_cases": 0,
            "efficiency": 0,
            "overall": 0,
            "summary": "Feedback generation failed. Please retry or check the submitted code."
        }
