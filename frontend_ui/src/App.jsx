import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import HomeView from './components/HomeView/HomeView';
import ListingDetailView from './components/ListingDetailView/ListingDetailView';
import MessagesView from './components/MessagesView/MessagesView';
import UserProfileView from './components/UserProfileView/UserProfileView';
import CreateListingView from './components/CreateListingView/CreateListingView';
import ApplicationModal from './components/ApplicationModal/ApplicationModal';
import AIAgentModal from './components/AIAgentModal/AIAgentModal';
import ListingCard from './components/ListingCard/ListingCard';
import { getListings } from './api/listings';
import { Bookmark } from 'lucide-react';
import './App.css';

function App() {
  const [view, setView] = useState("home");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [search, setSearch] = useState("");
  const [userMode, setUserMode] = useState("provider");

  // Listings now come from the backend API instead of a hardcoded mock array.
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('worklyUserMode');
    if (savedMode) {
      setUserMode(savedMode);
    }
  }, []);

  // Fetch listings from the API. Re-runs whenever the search text changes so the
  // backend does the filtering (GET /api/listings?search=...).
  useEffect(() => {
    let ignore = false; // guards against a slow response overwriting a newer one
    setIsLoading(true);
    setError(null);

    getListings({ search })
      .then((data) => {
        if (!ignore) setListings(data);
      })
      .catch((err) => {
        console.error("Failed to load listings:", err);
        if (!ignore) setError("Could not load listings. Is the backend running?");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search]);

  // Toggle between client and provider mode
  const toggleUserMode = () => {
    const newMode = userMode === 'client' ? 'provider' : 'client';
    setUserMode(newMode);
    localStorage.setItem('worklyUserMode', newMode);
  };

  const navigate = (newView, data) => {
    if (newView === "listing" && data) {
      setSelectedListing(data);
    }
    setView(newView);
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(id)) {
        newBookmarks.delete(id);
      } else {
        newBookmarks.add(id);
      }
      return newBookmarks;
    });
  };

  const pageTitles = {
    home: "Home",
    listing: selectedListing?.title ?? "Listing",
    messages: "Messages",
    profile: "My Profile",
    "create-listing": "Post a Listing",
    bookmarks: "Bookmarks"
  };

  const isMessagesView = view === "messages";

  return (
    <div className={`app ${userMode}-mode`}>
      <aside className="sidebar" style={{ width: sidebarOpen ? 256 : 0 }}>
        <Sidebar
          currentView={view}
          userMode={userMode}
          navigate={navigate}
          onOpenAI={() => setShowAIModal(true)}
          onOpenCreate={() => navigate("create-listing")}
        />
      </aside>

      <div className="main">
        <TopBar
          title={pageTitles[view] ?? "Workly"}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          search={search}
          onSearchChange={setSearch}
        />

        <div className={`content ${isMessagesView ? "messages" : ""}`}>
          {view === "home" && (
            <>
              {isLoading && <p className="feed-status">Loading listings…</p>}
              {error && <p className="feed-status feed-error">{error}</p>}
              <HomeView
                listings={listings}
                bookmarks={bookmarks}
                onBookmark={toggleBookmark}
                onNavigate={navigate}
                onOpenAI={() => setShowAIModal(true)}
              />
            </>
          )}

          {view === "listing" && selectedListing && (
            <ListingDetailView
              listing={selectedListing}
              userMode={userMode}
              onBack={() => setView("home")}
              onApply={() => setShowApplyModal(true)}
            />
          )}

          {view === "messages" && <MessagesView />}

          {view === "profile" && (
            <UserProfileView
              userMode={userMode}
              onToggleMode={toggleUserMode}
            />
          )}

          {view === "create-listing" && <CreateListingView onDone={() => setView("home")} />}

          {view === "bookmarks" && (
            <div className="home-wrap">
              <div className="listing-feed">
                {listings.filter((l) => bookmarks.has(l.id)).map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    bookmarked={true}
                    onBookmark={() => toggleBookmark(listing.id)}
                    onClick={() => navigate("listing", listing)}
                  />
                ))}
                {bookmarks.size === 0 && (
                  <div className="empty-state">
                    <Bookmark size={32} />
                    <p>No bookmarks yet</p>
                    <small>Save listings to find them here</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApplyModal && (
        <ApplicationModal listing={selectedListing} onClose={() => setShowApplyModal(false)} />
      )}

      {showAIModal && <AIAgentModal onClose={() => setShowAIModal(false)} />}
    </div>
  )
}

export default App
