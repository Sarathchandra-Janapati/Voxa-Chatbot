const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const typingIndicator = document.getElementById("typing-indicator");

async function sendMessage(message) {
    // Add user message
    addMessage(message, "user");

    typingIndicator.style.display = "block";

    // Send to backend
    const response = await fetch("https://voxa-chatbot.onrender.com/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
    });

    const data = await response.json();

    typingIndicator.style.display = "none";

    // Add AI message
    addMessage(data.response, "ai");
}

function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Button click
sendBtn.addEventListener("click", () => {
    if (userInput.value.trim() !== "") {
        sendMessage(userInput.value.trim());
        userInput.value = "";
    }
});

// Enter key
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

// Voice recognition
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
