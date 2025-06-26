

import streamlit as st
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))


from interview_session import InterviewSession



st.set_page_config(page_title="AI InterviewSim", layout="centered")
st.title("💬 AI InterviewSim (Chat Mode)")
st.markdown("Practice mock interviews with an intelligent AI recruiter.")

# --- SESSION INIT ---
if "session" not in st.session_state:
    st.session_state.session = None
    st.session_state.qna = []
    st.session_state.state = "setup"
    st.session_state.current_q = None

# --- RESUME + ROLE INPUT ---
if st.session_state.state == "setup":
    st.subheader("Upload Resume + Choose Role")
    resume_file = st.file_uploader("📄 Upload parsed resume JSON", type="json")
    role = st.text_input("💼 Job Role (e.g., Software Engineer)")
    rounds = st.slider("🔁 Number of Rounds", 1, 5, 3)

    if st.button("Start Interview") and resume_file and role:
        with open("temp_resume.json", "wb") as f:
            f.write(resume_file.read())

        st.session_state.session = InterviewSession(
            resume_path="temp_resume.json",
            role=role,
            rounds=rounds,
            session_id="streamlit_user"
        )
        st.session_state.qna = []
        st.session_state.state = "interview"
        st.session_state.current_q = None
        st.rerun()

# --- INTERVIEW MODE ---
elif st.session_state.state == "interview":
    session = st.session_state.session

    # Show chat history
    for qa in st.session_state.qna:
        with st.chat_message("ai"):
            st.markdown(qa["question"])
        with st.chat_message("user"):
            st.markdown(qa["answer"])

    # Ask next question
    if not session.is_complete():
        if st.session_state.current_q is None:
            question = session.ask_question()  # No duplicate check anymore
            st.session_state.current_q = question

        with st.chat_message("ai"):
            st.markdown(st.session_state.current_q)

        answer = st.chat_input("🧑 Your answer...")
        if answer:
            session.provide_answer(answer)
            st.session_state.qna.append({
                "question": st.session_state.current_q,
                "answer": answer
            })
            st.session_state.current_q = None
            st.rerun()
    else:
        st.session_state.state = "completed"
        st.rerun()

# --- SUMMARY MODE ---
elif st.session_state.state == "completed":
    st.success("✅ Interview Completed!")
    session = st.session_state.session

    if not session.final_feedback:
        session.generate_final_feedback()
        feedback = session.final_feedback
        if "error" in feedback:
            st.error("❌ Feedback generation failed. Try again.")
        else:
            st.subheader("🧠 AI Feedback Summary")
            st.markdown(f"**📝 Summary:** {feedback['summary']}")
            st.markdown("### 📊 Feedback Scores")

            col1, col2, col3 = st.columns(3)
            col1.metric("🎯 Relevance", f"{feedback['relevance']}/5")
            col2.metric("💡 Clarity", f"{feedback['clarity']}/5")
            col3.metric("📚 Depth", f"{feedback['depth']}/5")

            col4, col5, col6 = st.columns(3)
            col4.metric("📁 Examples", f"{feedback['examples']}/5")
            col5.metric("🗣️ Communication", f"{feedback['communication']}/5")
            col6.metric("⭐ Overall", f"{feedback['overall']}/5")

    with st.expander("📄 Show Full Interview Transcript"):
        for i, step in enumerate(st.session_state.qna, 1):
            st.markdown(f"**Q{i}:** {step['question']}")
            st.markdown(f"**🧑 Answer:** {step['answer']}")
            st.markdown("---")


    if st.button("🔁 Restart"):
        for key in st.session_state.keys():
            del st.session_state[key]
        st.rerun()
