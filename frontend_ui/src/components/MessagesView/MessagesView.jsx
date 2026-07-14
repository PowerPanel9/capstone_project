import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { mockConversations } from '../../data/mockConversations';
import { mockChatMessages } from '../../data/mockChatMessages';
import './MessagesView.css';

function MessagesView() {
  const [activeConversation, setActiveConversation] = useState(mockConversations[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="messages-wrap">
      <div className="conv-list">
        <div className="conv-search">
          <div className="conv-search-inner">
            <Search size={13} />
            <input className="conv-search-input" placeholder="Search conversations..." />
          </div>
        </div>

        <div className="conv-items">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              className={`conv-item ${activeConversation.id === conv.id ? "active" : ""}`}
              onClick={() => setActiveConversation(conv)}
            >
              <div className="conv-avatar-wrap">
                <ProfilePicture initials={conv.avatar} size="xs" />
                {conv.unread > 0 && <span className="conv-unread">{conv.unread}</span>}
              </div>
              <div className="conv-info">
                <div className="conv-top">
                  <span className="conv-name">{conv.name}</span>
                  <span className="conv-time">{conv.time}</span>
                </div>
                <div className="conv-msg">{conv.lastMsg}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-header">
          <ProfilePicture initials={activeConversation.avatar} size="xs" />
          <div>
            <div className="chat-header-name">{activeConversation.name}</div>
            <div className="online-dot">
              <span className="dot-teal" />
              Online
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {mockChatMessages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.from === "me" ? "me" : ""}`}>
              <div className={`chat-bubble ${msg.from === "me" ? "me" : "them"}`}>
                {msg.text}
                <div className={`bubble-time ${msg.from === "me" ? "me" : "them"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-bar">
          <div className="chat-input-inner">
            <input
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="send-btn">
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesView;
