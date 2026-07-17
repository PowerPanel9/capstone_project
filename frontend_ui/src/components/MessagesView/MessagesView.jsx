import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, Send } from "lucide-react";
import { getConversation, getInbox, sendMessage } from "../../api/messages";
import './MessagesView.css';

function MessagesView({ startConversationUser, onStartConversationHandled }) {
  const [inbox, setInbox] = useState([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const currentUserId = useMemo(() => {
    try {
      return Number(JSON.parse(localStorage.getItem("user") || "{}")?.id) || null;
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    setIsLoadingInbox(true);
    getInbox()
      .then((data) => {
        if (!ignore) setInbox(data);
      })
      .catch((error) => {
        console.error("Failed to load inbox:", error);
        if (!ignore) setInbox([]);
      })
      .finally(() => {
        if (!ignore) setIsLoadingInbox(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return inbox;
    return inbox.filter((item) => {
      const first = String(item?.partner?.firstName || "").toLowerCase();
      const last = String(item?.partner?.lastName || "").toLowerCase();
      return `${first} ${last}`.includes(q);
    });
  }, [inbox, conversationSearch]);

  const toName = (user) =>
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown";

  const loadConversation = async (user) => {
    if (!user?.id) return;
    setSelectedPartner(user);
    setIsLoadingConversation(true);
    try {
      const data = await getConversation(user.id);
      setSelectedPartner(data.otherUser || user);
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setMessages([]);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  useEffect(() => {
    if (!startConversationUser?.id) return;
    loadConversation(startConversationUser);
    onStartConversationHandled?.();
  }, [startConversationUser]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPartner?.id) return;
    setDraft("");
    try {
      const created = await sendMessage({
        recipientId: selectedPartner.id,
        content: text,
      });
      setMessages((prev) => [...prev, created]);
      setInbox((prev) => {
        const remaining = prev.filter((row) => row?.partner?.id !== selectedPartner.id);
        return [
          {
            partner: selectedPartner,
            lastMessage: created,
          },
          ...remaining,
        ];
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setDraft(text);
    }
  };

  const selectedPartnerId = selectedPartner?.id;

  return (
    <div className="messages-wrap">
      <div className="conv-list">
        <div className="conv-search">
          <div className="conv-tools">
            <span className="conv-title">Messages</span>
          </div>
          <div className="conv-search-inner">
            <Search size={13} />
            <input
              className="conv-search-input"
              placeholder="Search conversations..."
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="conv-items">
          {!isLoadingInbox && filteredConversations.length === 0 ? (
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
            filteredConversations.filter((conv) => conv?.partner?.id).map((conv) => (
              <button
                key={conv.partner.id}
                className={`conv-item ${selectedPartnerId === conv.partner.id ? "active" : ""}`}
                type="button"
                onClick={() => loadConversation(conv.partner)}
              >
                <div className="conv-info">
                  <div className="conv-top">
                    <span className="conv-name">{toName(conv.partner)}</span>
                    <span className="conv-time">
                      {conv?.lastMessage?.createdAt
                        ? new Date(conv.lastMessage.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="conv-msg">{conv?.lastMessage?.content || "No messages yet"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="chat-panel">
        {!selectedPartner ? (
          <div className="chat-empty">
            <MessageSquare size={48} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No conversation selected</p>
            <small style={{ fontSize: 13 }}>Select a conversation to start messaging</small>
          </div>
        ) : (
          <div className="chat-live">
            <div className="chat-header">
              <p className="chat-header-name">{toName(selectedPartner)}</p>
            </div>
            <div className="chat-messages">
              {isLoadingConversation ? (
                <p>Loading conversation...</p>
              ) : messages.length === 0 ? (
                <div className="chat-start-state">
                  <MessageSquare size={20} />
                  <p className="chat-start-title">No messages yet</p>
                  <p className="chat-start-subtitle">Start the conversation with your first message.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.userIdFrom === currentUserId;
                  return (
                    <div key={message.id} className={`chat-msg ${mine ? "me" : ""}`}>
                      <div className={`chat-bubble ${mine ? "me" : "them"}`}>
                        {message.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="chat-input-bar">
              <div className="chat-input-inner">
                <input
                  className="chat-input"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSend();
                  }}
                />
                <button type="button" className="send-btn" onClick={handleSend} aria-label="Send message">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesView;
