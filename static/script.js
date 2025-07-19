const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

let audio = null;
let recognition = null;

// Initialize speech recognition once
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    userInput.value = speechToText;
    sendBtn.click();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    // Optional: You can auto-restart recognition here if you want continuous listen
  };
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}

function stopRecognition() {
  if (recognition && recognition.recognizing) {
    recognition.stop();
  }
}

async function sendMessage(message) {
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  typingIndicator.style.display = "block";

  // Disable input to prevent spamming
  sendBtn.disabled = true;
  voiceBtn.disabled = true;

  // Stop any current speech playing
  stopAudio();

  try {
    const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    typingIndicator.style.display = "none";

    addMessage(data.response, "ai");

    if (data.audio_url) {
      audio = new Audio(data.audio_url);

      // When audio ends, auto-start recognition again (if available)
      audio.onended = () => {
        audio = null;
        if (recognition) recognition.start();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error", e);
      };

      audio.play();
    } else {
      // If no audio, start recognition immediately
      if (recognition) recognition.start();
    }
  } catch (err) {
    typingIndicator.style.display = "none";
    addMessage("Oops, something went wrong. Please try again.", "ai");
    console.error(err);
  } finally {
    // Re-enable input/buttons
    sendBtn.disabled = false;
    voiceBtn.disabled = false;
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send button triggers sendMessage
sendBtn.addEventListener("click", () => {
  if (userInput.value.trim() !== "") {
    sendMessage(userInput.value.trim());
  }
});

// Enter key triggers send button
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Voice button logic
voiceBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Sorry, your browser does not support Speech Recognition.");
    return;
  }

  // Stop any playing audio to avoid overlap
  stopAudio();

  // Stop current recognition if running to restart fresh
  recognition.abort && recognition.abort();

  // Start listening
  recognition.start();
});
