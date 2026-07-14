import { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import './AIAgentModal.css';

function AIAgentModal({ onClose }) {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi! I'm Workly AI. I can help you find the perfect freelancer, write a job listing, or match candidates to your needs. What can I help you with?"
    }
  ]);
  const [input, setInput] = useState("");

  const suggestions = [
    "Find me a React developer",
    "Help write a job listing",
    "What skills are in demand?",
    "Review my profile"
  ];

  const sendMessage = (text) => {
    if (!text.trim()) return;

    setMessages([
      ...messages,
      { from: "user", text },
      {
        from: "ai",
        text: "Great question! Based on current listings and market data, I found 47 active React developers available right now, with rates ranging from $60–$150/hr. Would you like me to filter by experience level, location, or availability?"
      }
    ]);
    setInput("");
  };

  return (
    <div className="modal-bg">
      <div className="ai-modal">
        <div className="ai-modal-header">
          <div className="ai-modal-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="ai-modal-name">Workly AI</div>
            <div className="ai-modal-status">
              <span className="dot-teal" />
              Online · Ready to help
            </div>
          </div>
          <button className="close-btn" style={{ marginLeft: "auto" }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg-row ${msg.from === "user" ? "user" : ""}`}>
              {msg.from === "ai" && (
                <div className="ai-icon-sm">
                  <Sparkles size={12} />
                </div>
              )}
              <div className={`ai-bubble ${msg.from}`}>{msg.text}</div>
            </div>
          ))}
        </div>

        {messages.length === 1 && (
          <div className="suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="suggestion-btn"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="ai-input-bar">
          <div className="ai-input-inner">
            <input
              className="ai-text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask Workly AI anything..."
              autoFocus
            />
            <button className="ai-send-btn" onClick={() => sendMessage(input)}>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAgentModal;
