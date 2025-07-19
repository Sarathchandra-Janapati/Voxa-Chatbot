const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

let audio = null;
let recognition = null;

// Initialize speech recognition if available
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    showListening();
  };

  recognition.onend = () => {
    hideIndicator();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    hideIndicator();
  };

  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    userInput.value = speechToText;
    sendBtn.click();
  };
}

// Show "Listening..." text
function showListening() {
  typingIndicator.style.display = "block";
  typingIndicator.textContent = "Listening...";
}

// Show AI typing dots animation
function showTyping() {
  typingIndicator.style.display = "block";
  typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
}

// Hide typing/listening indicator
function hideIndicator() {
  typingIndicator.style.display = "none";
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}

async function sendMessage(message) {
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  showTyping();

  // Disable buttons while processing
  sendBtn.disabled = true;
  voiceBtn.disabled = true;

  stopAudio();

  try {
    const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    addMessage(data.response, "ai");

    if (data.audio_url) {
      audio = new Audio(data.audio_url);

      audio.onended = () => {
        audio = null;
        if (recognition) recognition.start();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error", e);
      };

      audio.play();
    } else {
      if (recognition) recognition.start();
    }
  } catch (err) {
    addMessage("Oops, something went wrong. Please try again.", "ai");
    console.error(err);
  } finally {
    hideIndicator();
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

// Send button click
sendBtn.addEventListener("click", () => {
  if (userInput.value.trim() !== "") {
    sendMessage(userInput.value.trim());
  }
});

// Enter key sends message
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Voice button logic
voiceBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Sorry, your browser does not support Speech Recognition.");
    return;
  }

  // Stop playing audio to avoid overlap
  stopAudio();

  // Abort current recognition to restart fresh
  recognition.abort && recognition.abort();

  // Start speech recognition
  recognition.start();
});
