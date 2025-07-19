from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import asyncio
import edge_tts
import uuid
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static")
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

AUDIO_DIR = os.path.join(app.static_folder, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def chat_with_ai(user_input: str) -> str:
    """Send message to Groq model and return AI response."""
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are Voxa, a friendly AI assistant."},
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content

async def edge_speak_async(text: str, filename: str):
    """Generate TTS audio asynchronously."""
    tts = edge_tts.Communicate(text, "en-US-JennyNeural")
    await tts.save(filename)

def generate_speech(text: str) -> str:
    """Generate MP3 file from text and return static file URL."""
    filename = f"{uuid.uuid4()}.mp3"
    mp3_path = os.path.join(AUDIO_DIR, filename)
    asyncio.run(edge_speak_async(text, mp3_path))
    return f"/static/audio/{filename}"

@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "ok", "message": "Voxa API is running!"})

@app.route(methods=["POST"])
def ask():
    user_input = request.json.get("message", "").strip()
    if not user_input:
        return jsonify({"response": "Please say something!"})

    try:
        response_text = chat_with_ai(user_input)
        audio_url = generate_speech(response_text)
        return jsonify({"response": response_text, "audio_url": audio_url})
    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
