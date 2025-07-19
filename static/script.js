const API_BASE_URL = "https://voxa-chatbot.onrender.com";

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

let currentAudio = null;
let currentRequestId = 0; // ✅ Prevents mixed responses
let autoListenTimer = null;

async function sendMessage(message) {
    if (!message.trim()) return;

    stopCurrentSpeech(); // ✅ Stop previous speech immediately

    addMessage(message, "user");
    typingIndicator.style.display = "block";

    const requestId = ++currentRequestId; // ✅ Only latest request matters

    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (requestId !== currentRequestId) return; // ✅ Ignore outdated response

        typingIndicator.style.display = "none";
        addMessage(data.response, "ai");

        if (data.audio_url) {
            currentAudio = new Audio(`${API_BASE_URL}${data.audio_url}`);
            currentAudio.play();

            currentAudio.onended = () => {
                if (requestId === currentRequestId) autoStartListening();
            };
        } else {
            autoStartListening();
        }

    } catch (error) {
        if (requestId !== currentRequestId) return;
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

function stopCurrentSpeech() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    clearTimeout(autoListenTimer);
}

function autoStartListening() {
    clearTimeout(autoListenTimer);
    autoListenTimer = setTimeout(() => {
        recognition.start();
    }, 1000);
}

// ✅ Send button click
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
    stopCurrentSpeech(); // ✅ User interrupted → stop old speech immediately
};

recognition.onstart = () => {
    clearTimeout(autoListenTimer);
};
