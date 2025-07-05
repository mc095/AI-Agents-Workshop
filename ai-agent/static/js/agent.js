const API_URL = 'http://localhost:8000';

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to scroll to the bottom of the conversation area
function scrollToBottom() {
    const messagesContainer = document.getElementById('conversation-area');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to adjust textarea height dynamically
function adjustTextareaHeight() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 120)}px`; // Set height with max 120px
    }
}

// Function to show loading indicator
function showLoadingIndicator() {
    const messagesContainer = document.getElementById('conversation-area');
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loading-indicator';
    loadingMessage.className = 'message-container assistant-message-container';
    loadingMessage.innerHTML = `
        <div class="message-content">
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(loadingMessage);
    scrollToBottom();
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Function to add messages to the chat
function addChatMessage(sender, text, isMDX = false) {
    const messagesContainer = document.getElementById('conversation-area');

    // Hide the initial message if it exists
    const initialMessage = document.getElementById('initial-message');
    if (initialMessage) {
        initialMessage.style.display = 'none';
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';

    if (sender.toLowerCase() === 'you') {
        messageContainer.classList.add('user-message-container');
        messageContainer.innerHTML = `
            <div class="message-content">${escapeHtml(text)}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
    } else {
        messageContainer.classList.add('assistant-message-container');
        let html;
        if (isMDX) {
            // For now, treat MDX as markdown (since browser can't run React components natively)
            // This will render markdown, and any embedded JSX will be shown as code
            html = marked.parse(text, { breaks: true });
        } else {
            html = marked.parse(text, { breaks: true });
        }
        // Optionally, add a class to paragraphs for better spacing
        html = html.replace(/<p>/g, '<p style="margin-bottom: 0.75em;">');
        messageContainer.innerHTML = `
            <div class="message-content">${html}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
    }

    messagesContainer.appendChild(messageContainer);
    scrollToBottom();
}

// Function to clear chat history
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        const messagesContainer = document.getElementById('conversation-area');
        messagesContainer.innerHTML = `
            <div id="initial-message" class="flex flex-col items-center justify-center h-full">
                <div class="w-16 h-16 rounded-full bg-[#20B2AA] flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 8v4"/><path d="M19 8v4"/><path d="M8 5h4"/><path d="M8 19h4"/><path d="M3 12h4"/><path d="M17 12h4"/></svg>
                </div>
                <h2 class="text-3xl font-light text-white mb-4">How can I help you today?</h2>
                <p class="text-[#888888] text-center max-w-lg leading-relaxed">
                    I'm an AI assistant. Ask me anything.
                </p>
            </div>
        `;
    }
}

// Function to send chat message
async function sendChatMessage() {
    const inputEl = document.getElementById('chatInput');
    const message = inputEl.value.trim();
    if (!message) {
        return;
    }

    addChatMessage('You', message);
    inputEl.value = '';
    const sendButton = document.getElementById('sendChatBtn');
    sendButton.disabled = true;

    showLoadingIndicator();

    try {
        // Instruct the LLM to always return MDX-formatted responses for neat display
        const prompt = `${message}\n\n(Respond in MDX for neat formatting. Use MDX syntax for all formatting and code blocks.)`;
        console.log("Sending message to:", `${API_URL}/agent/chat`);
        const response = await fetch(`${API_URL}/agent/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.reply || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Received response:", data);

        // Handle empty responses
        if (!data.reply || data.reply === "[]" || data.reply.trim() === "") {
            addChatMessage('Assistant', "I'm here to help with your tasks. You can ask me to show your tasks, create a new task, or get insights about your tasks. What would you like to do?");
        } else {
            // Clean up the response by removing any function call markers
            let cleanedReply = data.reply.replace(/\[.*?\]/g, '').trim();
            // Ensure at least one blank line before and after for neatness
            cleanedReply = `\n${cleanedReply}\n`;
            addChatMessage('Assistant', cleanedReply, true);
        }
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = error.message;
        if (errorMessage.includes("Failed to fetch")) {
            errorMessage = "Failed to connect to the server. Please check your connection and try again.";
        }
        addChatMessage('Assistant', `Sorry, there was an error: ${errorMessage}`);
    } finally {
        hideLoadingIndicator();
        sendButton.disabled = false;
    }
}

// Add event listeners after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener to the send button
    const sendButton = document.getElementById('sendChatBtn');
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    } else {
        console.error("Send button not found");
    }

    // Add event listener to the chat input for Enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                sendChatMessage();
            }
        });
        chatInput.addEventListener('input', adjustTextareaHeight);
    } else {
        console.error("Chat input not found");
    }
});