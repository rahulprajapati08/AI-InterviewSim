import gradio as gr
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'prototype-backend')))
from resume_parser import parse_resume_with_llm

from text_to_speech import speak
from speech_to_text import record_audio, transcribe
from interview_session import InterviewSession

# === Setup Interview Session ===

chat_history = [
    {"role": "assistant", "content": "Welcome to your interview! How are you feeling today?"}
]
session = None
# === Utility ===
def format_feedback(feedback: dict) -> str:
    if "error" in feedback:
        return f"❌ Feedback error: {feedback['error']}"
    return f"""
### 📝 Interview Feedback

- **Relevance:** {feedback['relevance']}
- **Clarity:** {feedback['clarity']}
- **Depth:** {feedback['depth']}
- **Examples:** {feedback['examples']}
- **Communication:** {feedback['communication']}
- **Overall Score:** **{feedback['overall']}**

📌 **Summary:**
> {feedback['summary']}
"""

# === Navigation Functions ===
def go_to_interview_page(resume , role , count):
    global session
    if not resume or not role:
        return gr.update(visible=True), gr.update(visible=False), gr.update(visible=False), "⚠️ Please upload resume and job role.",chat_history
    parsed = parse_resume_with_llm(resume.name)
    if "error" in parsed:
        return gr.update(visible=True), gr.update(visible=False), gr.update(visible=False), f"❌ Error: {parsed['error']}",chat_history
    session = InterviewSession(
    resume_obj=parsed,
    role=role,
    rounds=count
)
    speak(chat_history[-1]["content"])
    return gr.update(visible=False), gr.update(visible=True), gr.update(visible=False), gr.update(interactive=False) ,"",chat_history

def go_to_feedback_page():
    global session
    session.generate_final_feedback()
    feedback_text = format_feedback(session.final_feedback)
    return gr.update(visible=False), gr.update(visible=False), gr.update(visible=True), feedback_text

# === Bot Load ===
"""
def bot_response(history):
    speak(history[-1]["content"])
    return history
"""

# === Voice Logic ===
def voice_reply(chatbox, feedback_btn):
    global session

    if len(session.history) == 0:
        q = session.ask_question()
        chatbox.append({"role": "assistant", "content": q})
        speak(q)
        yield chatbox, feedback_btn
        return

    audio_path = record_audio()
    user_text = transcribe(audio_path)
    chatbox.append({"role": "user", "content": user_text})
    yield chatbox, feedback_btn

    session.provide_answer(user_text)
    next_q = session.ask_question()

    if next_q:
        chatbox.append({"role": "assistant", "content": next_q})
        speak(next_q)
        yield chatbox, feedback_btn
    else:
        chatbox.append({"role": "assistant", "content": "✅ Interview complete. Click 'Generate Feedback'."})
        yield chatbox, gr.update(interactive=True)

# === Gradio UI ===
with gr.Blocks() as app:
    # Pages
    home_page = gr.Column(visible=True)
    interview_page = gr.Row(visible=False)
    feedback_page = gr.Column(visible=False)
    
    with home_page:
        gr.Markdown("## 📝 AI InterviewSim:A Mock Interview Platform")
        resume_file = gr.File(label="Upload Resume (PDF)", file_types=[".pdf"])
        job_role = gr.Textbox(label="Job Role", placeholder="e.g. Data Analyst")
        num_questions = gr.Slider(1, 10, step=1, value=5, label="Number of Questions")
        start_btn = gr.Button("🚀 Start Mock Interview")
        warn = gr.Markdown()

    # INTERVIEW PAGE
    feedback_btn = None
    with interview_page:
        with gr.Column(scale=2):
            gr.Markdown("### 🎥 Webcam Feed")
            webcam = gr.Image(sources="webcam", streaming=True)

        with gr.Column(scale=1):
            gr.Markdown("### 💬 Interview Chat (Voice)")
            chatbox = gr.Chatbot(value=chat_history, show_copy_button=True, label="Voice Chat", type="messages")
            with gr.Row():
                voice_btn = gr.Button("🎤 Reply with Voice")
                feedback_btn = gr.Button("🎯 Generate Feedback", interactive=False)

            
            voice_btn.click(fn=voice_reply, inputs=[chatbox, feedback_btn], outputs=[chatbox, feedback_btn])

    # FEEDBACK PAGE
    feedback_text = gr.Markdown(visible=False)

    with feedback_page:
        gr.Markdown("### 🌟 Feedback Page")
        feedback_text = gr.Markdown()

    # NAVIGATION WIRING
    start_btn.click(fn=go_to_interview_page, inputs=[resume_file, job_role, num_questions], outputs=[home_page, interview_page, feedback_page, feedback_btn,warn,chatbox])
    feedback_btn.click(fn=go_to_feedback_page, outputs=[home_page, interview_page, feedback_page, feedback_text])

app.launch()
