import { useState } from 'react';
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
import { mockListings } from './data/mockListings';
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

  const filteredListings = mockListings.filter(
    (listing) =>
      search === "" ||
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

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
    <div className="app">
      <aside className="sidebar" style={{ width: sidebarOpen ? 256 : 0 }}>
        <Sidebar
          currentView={view}
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
            <HomeView
              listings={filteredListings}
              bookmarks={bookmarks}
              onBookmark={toggleBookmark}
              onNavigate={navigate}
              onOpenAI={() => setShowAIModal(true)}
            />
          )}

          {view === "listing" && selectedListing && (
            <ListingDetailView
              listing={selectedListing}
              onBack={() => setView("home")}
              onApply={() => setShowApplyModal(true)}
            />
          )}

          {view === "messages" && <MessagesView />}

          {view === "profile" && <UserProfileView />}

          {view === "create-listing" && <CreateListingView onDone={() => setView("home")} />}

          {view === "bookmarks" && (
            <div className="home-wrap">
              <div className="listing-feed">
                {mockListings.filter((l) => bookmarks.has(l.id)).map((listing) => (
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
