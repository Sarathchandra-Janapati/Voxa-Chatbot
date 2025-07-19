from flask import Flask, request, jsonify, render_template, url_for
from flask_cors import CORS
from groq import Groq
import asyncio
import edge_tts
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static")
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

AUDIO_DIR = os.path.join(app.static_folder, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def chat_with_ai(user_input):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are Voxa, a friendly and professional AI assistant."},
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content

async def edge_speak_async(text, filename):
    tts = edge_tts.Communicate(text, "en-US-JennyNeural")
    await tts.save(filename)

def generate_speech(text):
    filename = f"{uuid.uuid4()}.mp3"
    mp3_path = os.path.join(AUDIO_DIR, filename)
    asyncio.run(edge_speak_async(text, mp3_path))
    return filename

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask():
    user_input = request.json.get("message", "").strip()
    if not user_input:
        return jsonify({"response": "Please say something!"})

    response_text = chat_with_ai(user_input)
    mp3_filename = generate_speech(response_text)
    audio_url = url_for("static", filename=f"audio/{mp3_filename}")

    return jsonify({"response": response_text, "audio_url": audio_url})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
