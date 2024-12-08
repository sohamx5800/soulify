document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  darkModeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
  });
});

function startChat() {
  window.location.href = 'chat.html';
}

function endChat() {
  alert('Chat Ended');
  window.location.href = 'index.html';
}

function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const message = chatInput.value.trim();

  if (message) {
    const userMessage = document.createElement('p');
    userMessage.textContent = `You: ${message}`;
    chatMessages.appendChild(userMessage);

    // Simulate stranger's reply
    setTimeout(() => {
      const strangerMessage = document.createElement('p');
      strangerMessage.textContent = `Stranger: Hello, ${message}`;
      chatMessages.appendChild(strangerMessage);
    }, 1000);

    chatInput.value = '';
  }
}

function showTyping() {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.textContent = 'Stranger: Typing...........';

  setTimeout(() => {
    typingIndicator.textContent = '';
  }, 1500);
}
