from gtts import gTTS
from pydub import AudioSegment
import simpleaudio
import tempfile
import os

def speak(text, lang='en'):
    tts = gTTS(text=text, lang=lang)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        tts.save(fp.name)
        temp_path = fp.name

    try:
        audio = AudioSegment.from_mp3(temp_path)
        play_obj = simpleaudio.play_buffer(
            audio.raw_data,
            num_channels=audio.channels,
            bytes_per_sample=audio.sample_width,
            sample_rate=audio.frame_rate
        )
        play_obj.wait_done()  # ✅ Wait until playback finishes
    finally:
        os.remove(temp_path)  # ✅ Now safe to delete
