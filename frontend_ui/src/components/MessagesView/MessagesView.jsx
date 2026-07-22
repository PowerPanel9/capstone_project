import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Search, Send, X, ArrowLeft } from "lucide-react";
import { getConversation, getInbox, sendMessage } from "../../api/messages";
import './MessagesView.css';

function MessagesView({ startConversationUser, startListing, onStartConversationHandled }) {
  const [inbox, setInbox] = useState([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  // The listing this conversation is about, shown as a chip above the input.
  // It attaches to the next message the user sends, then clears.
  const [attachedListing, setAttachedListing] = useState(null);
  const navigate = useNavigate();

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
    // If we arrived from a listing, remember it so it attaches to the next message.
    if (startListing?.id) setAttachedListing(startListing);
    onStartConversationHandled?.();
  }, [startConversationUser]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPartner?.id) return;
    setDraft("");
    // Attach the listing (if any) to THIS message, then clear it so later
    // messages in the conversation are just normal text.
    const listingId = attachedListing?.id || undefined;
    setAttachedListing(null);
    try {
      const created = await sendMessage({
        recipientId: selectedPartner.id,
        content: text,
        listingId,
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
      // Sending failed, so put the listing chip back for the retry.
      if (listingId) setAttachedListing(attachedListing);
    }
  };

  const selectedPartnerId = selectedPartner?.id;

  return (
    // `has-selection` lets the CSS show one pane at a time on mobile: the list
    // when nothing's selected, the chat once a conversation is open.
    <div className={`messages-wrap ${selectedPartner ? "has-selection" : ""}`}>
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
              {/* Back button returns to the conversation list on mobile
                  (hidden on desktop, where both panes are visible). */}
              <button
                className="chat-back-btn"
                type="button"
                onClick={() => setSelectedPartner(null)}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>
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
                      {/* If this message is about a listing, show a small card
                          above the bubble that links back to the listing. */}
                      {message.listing && (
                        <button
                          type="button"
                          className="chat-listing-card"
                          onClick={() => navigate(`/listing/${message.listing.id}`)}
                        >
                          <span className="chat-listing-title">{message.listing.title}</span>
                          <span className="chat-listing-subtitle">View listing</span>
                        </button>
                      )}
                      <div className={`chat-bubble ${mine ? "me" : "them"}`}>
                        {message.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="chat-input-bar">
              {/* Chip showing the listing that will attach to the next message.
                  The user can remove it with the X if they don't want it. */}
              {attachedListing && (
                <div className="chat-attached-listing">
                  <div className="chat-attached-text">
                    <span className="chat-attached-title">{attachedListing.title}</span>
                    <span className="chat-attached-subtitle">Attached listing</span>
                  </div>
                  <button
                    type="button"
                    className="chat-attached-remove"
                    aria-label="Remove listing"
                    onClick={() => setAttachedListing(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
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
