import { Search, MessageSquare } from 'lucide-react';
import './MessagesView.css';

function MessagesView() {
  // TODO: Fetch conversations and messages from backend API
  // Replace this empty state with real data
  const conversations = [];

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
          {conversations.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              <MessageSquare size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No conversations yet</p>
              <small style={{ fontSize: 12 }}>Messages will appear here</small>
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} className="conv-item">
                {/* Conversation item content */}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="chat-panel">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#9CA3AF',
          textAlign: 'center'
        }}>
          <MessageSquare size={48} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No conversation selected</p>
          <small style={{ fontSize: 13 }}>Select a conversation to start messaging</small>
        </div>
      </div>
    </div>
  );
}

export default MessagesView;
