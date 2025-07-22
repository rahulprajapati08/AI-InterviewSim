# backend/confidence_utils.py

import librosa
import numpy as np

def get_confidence_score(audio_path: str) -> float:
    try:
        y, sr = librosa.load(audio_path)

        duration = librosa.get_duration(y=y, sr=sr)
        if duration < 1.0:
            return 0.2  # very short response = low confidence

        # Extract features
        rms = np.mean(librosa.feature.rms(y=y))           # energy
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)     # speaking speed
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))  # voice crispness

        # Normalize + combine into score
        rms_score = min(rms * 100, 1.0)
        tempo_score = min(tempo / 150, 1.0)  # cap at reasonable tempo
        zcr_score = min(zcr * 10, 1.0)

        # Weighted average
        confidence = 0.4 * rms_score + 0.3 * tempo_score + 0.3 * zcr_score

        return round(confidence, 2)
    except Exception as e:
        print(f"[Confidence Error] {e}")
        return 0.5  # fallback
