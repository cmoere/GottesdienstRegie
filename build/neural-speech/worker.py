"""GottesdienstRegie private Piper worker. GPL-3.0-or-later.
No network, shell, arbitrary model selection, or system Python packages.
"""
import sys
import io
import json
import re
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "site"))
if len(sys.argv) not in (2, 3) or sys.argv[1] not in ("male", "female", "karlsson", "ramona", "eva_k"):
    raise ValueError("Invalid voice")
reading = {"speed": 1.0, "sentencePauseMs": 280, "paragraphPauseMs": 600, "loudnessPercent": 150, "emphasis": "calm"}
if len(sys.argv) == 3:
    candidate = json.loads(sys.argv[2])
    if not isinstance(candidate, dict) or set(candidate) != set(reading):
        raise ValueError("Invalid reading settings")
    for key, low, high in [("speed", .7, 1.3), ("sentencePauseMs", 0, 1000), ("paragraphPauseMs", 0, 2000), ("loudnessPercent", 50, 200)]:
        if type(candidate[key]) not in (int, float) or not low <= candidate[key] <= high:
            raise ValueError("Invalid reading setting")
    if candidate["emphasis"] not in ("calm", "clear"):
        raise ValueError("Invalid emphasis")
    reading = candidate
text = sys.stdin.buffer.read(40001).decode("utf-8")
if not text.strip() or len(text) > 10000 or re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", text):
    raise ValueError("Invalid announcement")
# Text is speech, never an instruction to inject raw IPA/model controls.
text = text.replace("[[", "(").replace("]]", ")")
import onnxruntime as ort
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig

folder = ROOT / "voices" / sys.argv[1]
models = list(folder.glob("*.onnx"))
if len(models) != 1:
    raise ValueError("Voice model missing")
config = json.loads(Path(str(models[0]) + ".json").read_text(encoding="utf-8"))
espeak_data = ROOT / "site" / "piper" / "espeak-ng-data"
if sys.platform == "win32":
    # espeak-ng's C file API uses the Windows narrow-character path API.
    # Use the existing DOS path alias for non-ASCII installation paths.
    import ctypes
    buffer = ctypes.create_unicode_buffer(32768)
    size = ctypes.windll.kernel32.GetShortPathNameW(str(espeak_data), buffer, len(buffer))
    if size and size < len(buffer):
        espeak_data = Path(buffer.value)
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
options.log_severity_level = 3
session = ort.InferenceSession(str(models[0]), sess_options=options, providers=["CPUExecutionProvider"])
voice = PiperVoice(config=PiperConfig.from_dict(config), session=session, espeak_data_dir=espeak_data, download_dir=ROOT)
output = io.BytesIO()
syn = SynthesisConfig(length_scale=1.06 / reading["speed"], noise_scale=.55 if reading["emphasis"] == "calm" else .667, noise_w_scale=.65 if reading["emphasis"] == "calm" else .8, normalize_audio=True, volume=1.0)
with wave.open(output, "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(voice.config.sample_rate)
    # Paragraph/sentence pauses remain deliberate and bounded. Each sentence
    # keeps Piper's prosody, and the same voice is used for the complete text.
    parts = re.split(r"(\n\s*\n|(?<=[.!?])\s+)", text.strip())
    for index in range(0, len(parts), 2):
        part = parts[index]
        if not part.strip():
            continue
        voice.synthesize_wav(part.strip(), wav, syn_config=syn, set_wav_format=False)
        if index < len(parts) - 1:
            separator = parts[index + 1]
            pause = reading["paragraphPauseMs"] if "\n" in separator else reading["sentencePauseMs"]
            wav.writeframes(b"\0\0" * round(voice.config.sample_rate * pause / 1000))
        if output.tell() > 32 * 1024 * 1024:
            raise ValueError("Announcement too long")
sys.stdout.buffer.write(output.getvalue())
