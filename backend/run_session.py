from interview_session import InterviewSession

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
    answer = input('Your Answer:')
    followup = session.get_followup(answer)
    if followup:
      print(f"\n Follow up : {followup}")
      input("Your Followup answer")
    session.provide_answer(answer)  # always record answer
    session.current_round += 1 


  print('\nInterview Completed')
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