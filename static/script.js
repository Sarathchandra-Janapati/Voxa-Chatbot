const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

let currentAudio = null; // ✅ Per-session (per-device) audio

async function sendMessage(message) {
    addMessage(message, "user");
    typingIndicator.style.display = "block";

    // ✅ Stop current audio only for THIS device/session
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    try {
        const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        typingIndicator.style.display = "none";

        addMessage(data.response, "ai");

        // ✅ Play audio only for this session
        if (data.audio_url) {
            currentAudio = new Audio(data.audio_url);
            currentAudio.play();
        }
    } catch (error) {
        typingIndicator.style.display = "none";
        addMessage("Error connecting to server.", "ai");
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Button click
sendBtn.addEventListener("click", () => {
    if (userInput.value.trim() !== "") {
        sendMessage(userInput.value.trim());
        userInput.value = "";
    }
});

// ✅ Enter key
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

// ✅ Voice recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

voiceBtn.addEventListener("click", () => {
    recognition.start();
});

recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    userInput.value = speechToText;
    sendBtn.click();
};
