import { useState, useEffect } from 'react';
import { X, Sparkles, Send, RotateCcw } from 'lucide-react';
import { sendAgentMessage } from '../../api/agent';
import './AIAgentModal.css';

// Session storage key for persisting conversation
const CHAT_STORAGE_KEY = 'sidehustle_chat_session';

// `docked` renders the chat in place (e.g. in the home page side panel) instead
// of as a centered popup: no dark overlay and no close button, since it lives
// on the page rather than floating on top of it.
function AIAgentModal({ onClose, initialMessage = "", docked = false }) {
  // Load messages from sessionStorage on mount, or use default welcome message
  const loadMessages = () => {
    const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
      }
    }
    return [
      {
        from: "ai",
        text: "Hi! I'm SideHustle AI. I can help you find the perfect freelancer, write a job listing, or match candidates to your needs. What can I help you with?"
      }
    ];
  };

  const [messages, setMessages] = useState(loadMessages);
  // Prefill the input with any text passed in (e.g. from the "Ask AI" banner).
  const [input, setInput] = useState(initialMessage);
  // Tracks whether we're waiting for the backend so we can show a "thinking"
  // message and stop the user from sending a second request mid-flight.
  const [loading, setLoading] = useState(false);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Clear conversation and start fresh
  const clearConversation = () => {
    const freshMessages = [
      {
        from: "ai",
        text: "Hi! I'm SideHustle AI. I can help you find the perfect freelancer, write a job listing, or match candidates to your needs. What can I help you with?"
      }
    ];
    setMessages(freshMessages);
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(freshMessages));
  };

  const suggestions = [
    "Find me a React developer",
    "Help write a job listing",
    "What skills are in demand?",
    "Review my profile"
  ];

  // Send the user's message to the backend agent and show the real reply.
  // This is async because the agent call goes over the network and takes a
  // few seconds (Claude may run several MCP tool calls before answering).
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Show the user's message right away and clear the input box.
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendAgentMessage(text);
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch (error) {
      // If the backend fails, show a friendly message instead of crashing.
      console.error("Agent chat error:", error);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Sorry, something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // The chat panel itself. The same markup is used whether it's docked in the
  // page or floating in a popup; only the wrapper around it changes below.
  const chatPanel = (
      <div className={`ai-modal ${docked ? "ai-modal-docked" : ""}`}>
        <div className="ai-modal-header">
          <div className="ai-modal-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="ai-modal-name">SideHustle AI</div>
            <div className="ai-modal-status">
              <span className="dot-teal" />
              Online · Ready to help
            </div>
          </div>
          <button
            className="close-btn"
            style={{ marginLeft: "auto", marginRight: docked ? "0" : "8px" }}
            onClick={clearConversation}
            title="Clear conversation"
          >
            <RotateCcw size={15} />
          </button>
          {/* Close button. In the popup it dismisses the modal; when docked it
              closes the side panel. Only shown if an onClose handler exists. */}
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <X size={15} />
            </button>
          )}
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

          {/* While waiting for the backend, show a temporary "thinking" bubble. */}
          {loading && (
            <div className="ai-msg-row">
              <div className="ai-icon-sm">
                <Sparkles size={12} />
              </div>
              <div className="ai-bubble ai">Thinking…</div>
            </div>
          )}
        </div>

        {messages.length === 1 && !loading && (
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
              placeholder="Ask SideHustle AI anything..."
              disabled={loading}
              autoFocus={!docked}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
  );

  // Docked: render the panel on its own; the side column positions it.
  // Popup: wrap it in the dark full-screen overlay as before.
  if (docked) {
    return chatPanel;
  }

  // Clicking the dark backdrop (but not the panel itself) closes the popup.
  // The `e.target === e.currentTarget` check makes sure we only close when the
  // click lands on the backdrop, not when it bubbles up from inside the chat.
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <div className="modal-bg" onClick={handleBackdropClick}>
      {chatPanel}
    </div>
  );
}

export default AIAgentModal;
