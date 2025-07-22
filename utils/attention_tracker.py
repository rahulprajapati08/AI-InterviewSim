import cv2
import mediapipe as mp
import threading
import time

class ContinuousAttentionTracker:
    def __init__(self):
        self.focused_frames = 0
        self.total_frames = 0
        self.running = False
        self.thread = None

    def _track(self):
        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
        cap = cv2.VideoCapture(0)

        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(frame_rgb)

            self.total_frames += 1
            if results.multi_face_landmarks:
                self.focused_frames += 1

            # Optional: show preview
            cv2.imshow("🎥 Interview Attention Tracker", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._track)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()

    def get_attention_score(self):
        if self.total_frames == 0:
            return 0
        return round((self.focused_frames / self.total_frames) * 100, 2)
