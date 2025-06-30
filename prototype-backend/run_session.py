from interview_session import InterviewSession
import os
import sys
from attention_tracker import ContinuousAttentionTracker
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))
from speech_to_text import record_audio, transcribe
def main():
  session = InterviewSession(
    resume_path='test-files\Rahul_Resume_provisional__parsed.json',
    role='Software Development Engineer',
    rounds=3

  )

  print("Starting Interview...\n")

  while not session.is_complete():
    q=session.ask_question()
    if q is None:
      break
    print(f'\n Question : {q}')
    audio_path = record_audio()
    answer = transcribe(audio_path)
    print(f"🧑 You said: {answer}")

    attention = track_attention(duration=6)
    print(f"🧠 Attention Score: {attention}%")
    session.history[-1]["attention"] = attention
    followup = session.get_followup(answer)
    session.provide_answer(answer)
    if followup:
      audio_path = record_audio()
      followup_answer = transcribe(audio_path)
      session.provide_answer(followup_answer)
      print(f"🧑 You said : {followup_answer}")

      attention = track_attention(duration=6)
      print(f"🧠 Attention Score: {attention}%")
      session.history[-1]["attention"] = attention

     


  print('\nInterview Completed')
  tracker.stop()
  score = tracker.get_attention_score()
  print(f"🧠 Final Attention Score: {score}%")

# You can store this in session object:
  session.final_attention = score
  print('\n Interview Summary')
  for i , step in enumerate(session.summary(),1):
    print(f"\n🔹 Q{i}: {step['question']}")
    print(f"   🧑 Answer: {step['answer']}")
    if step['followup']:
        print(f"   🤖 Follow-Up: {step['followup']}")
    else:
        print("   ✅ No follow-up.")

if __name__=='__main__':
   main()
   tracker = ContinuousAttentionTracker()
   tracker.start()