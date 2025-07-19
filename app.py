from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from groq import Groq
import asyncio
import edge_tts
import threading
from playsound import playsound
import os
from dotenv import load_dotenv  # ✅ Add this

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY")) 
speech_thread = None


def chat_with_ai(user_input):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are Voxa, a friendly and professional AI assistant."},
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content


async def edge_speak_async(text):
    mp3_file = "speech_output.mp3"
    tts = edge_tts.Communicate(text, "en-US-JennyNeural")
    await tts.save(mp3_file)

    playsound(mp3_file, block=True)
    os.remove(mp3_file)


def speak(text):
    global speech_thread

    def run():
        asyncio.run(edge_speak_async(text))

    speech_thread = threading.Thread(target=run, daemon=True)
    speech_thread.start()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():
    user_input = request.json.get("message", "").strip()
    if not user_input:
        return jsonify({"response": "Please say something!"})

    response_text = chat_with_ai(user_input)
    speak(response_text)

    return jsonify({"response": response_text})


if __name__ == "__main__":
    app.run(debug=True)
