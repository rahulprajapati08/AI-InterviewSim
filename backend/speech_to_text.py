import sounddevice as sd 
from scipy.io.wavfile import write
import whisper
import numpy as np
import keyboard
import tempfile

model = whisper.load_model('base')

def record_audio(fs=44100, key='enter'):
  print("🎙️ Recording... (press Enter to stop)")
  audio_buffer = []

  def callback(indata, frames, time, status):
      audio_buffer.append(indata.copy())

  with sd.InputStream(samplerate=fs, channels=1, callback=callback):
      while True:
          if keyboard.is_pressed(key):
              break

  audio_data = np.concatenate(audio_buffer, axis=0)

  print("✅ Stopped Recording")

  with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as fp:
      write(fp.name, fs, audio_data)
      return fp.name
  
def transcribe(audio_path):
  result = model.transcribe(audio_path)
  return result['text']