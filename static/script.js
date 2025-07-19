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

    // ✅ Stop previous speech immediately if user interrupts
    stopCurrentSpeech();

    addMessage(message, "user");
    typingIndicator.style.display = "block";

    const requestId = ++currentRequestId; // ✅ Only the latest request matters

    try {
        const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // ✅ If user interrupted and a new request was made, ignore this response
        if (requestId !== currentRequestId) return;

        typingIndicator.style.display = "none";
        addMessage(data.response, "ai");

        // ✅ Speak new response only if it's the latest
        if (data.audio_url) {
            currentAudio = new Audio("https://voxa-chatbot.onrender.com" + data.audio_url);
            currentAudio.play();

            currentAudio.onended = () => {
                // ✅ If still latest request, auto-listen
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
    // ✅ Stop previous audio immediately
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    clearTimeout(autoListenTimer);
}

// ✅ Auto voice listening after response ends
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
