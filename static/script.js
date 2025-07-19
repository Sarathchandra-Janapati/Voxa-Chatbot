const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

let currentAudio = null;
let currentRequestId = 0; // ✅ To prevent mixing responses
let autoListenTimer = null;

async function sendMessage(message) {
    if (!message.trim()) return;

    // ✅ Stop previous speech immediately
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    clearTimeout(autoListenTimer); // Stop any auto-listen timer

    addMessage(message, "user");
    typingIndicator.style.display = "block";

    const requestId = ++currentRequestId; // ✅ Track the latest request

    try {
        const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // ✅ If this is not the latest request, ignore it (prevents mixing)
        if (requestId !== currentRequestId) return;

        typingIndicator.style.display = "none";
        addMessage(data.response, "ai");

        // ✅ Play speech and auto-listen after speaking
        if (data.audio_url) {
            currentAudio = new Audio(data.audio_url);
            currentAudio.play();

            currentAudio.onended = () => {
                currentAudio = null;
                autoStartListening(); // ✅ Auto voice recognition after speech ends
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

// ✅ Auto-start listening after bot finishes speaking
function autoStartListening() {
    clearTimeout(autoListenTimer);

    autoListenTimer = setTimeout(() => {
        recognition.start();
    }, 1000); // wait 1s before listening
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

// ✅ If the user speaks while auto-listening, cancel auto-listen timer
recognition.onstart = () => {
    clearTimeout(autoListenTimer);
};
