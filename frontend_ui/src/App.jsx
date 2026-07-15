import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { getListings, getListingById } from './api/listings';
import { getBookmarks, addBookmark, removeBookmark } from './api/bookmarks';
import { Bookmark } from 'lucide-react';
import './App.css';

function App() {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // `bookmarks` is a Set of LISTING ids (used by cards to show the filled icon).
  const [bookmarks, setBookmarks] = useState(new Set());
  // The backend deletes by BOOKMARK id, but the UI works in listing ids, so we
  // keep a map of listingId -> bookmarkId to know what to delete.
  const [bookmarkIds, setBookmarkIds] = useState({});
  const [userMode, setUserMode] = useState("provider");

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('worklyUserMode');
    if (savedMode) {
      setUserMode(savedMode);
    }
  }, []);

  // Load the logged-in user's bookmarks from the backend on mount.
  // If nobody is logged in, getBookmarks() returns [] so this is a safe no-op.
  useEffect(() => {
    getBookmarks()
      .then((data) => {
        setBookmarks(new Set(data.map((b) => b.listingId)));
        const map = {};
        data.forEach((b) => { map[b.listingId] = b.id; });
        setBookmarkIds(map);
      })
      .catch((err) => console.error("Failed to load bookmarks:", err));
  }, []);

  // Toggle between client and provider mode
  const toggleUserMode = () => {
    const newMode = userMode === 'client' ? 'provider' : 'client';
    setUserMode(newMode);
    localStorage.setItem('worklyUserMode', newMode);
  };

  // Add or remove a bookmark, calling the backend and keeping local state in sync.
  const toggleBookmark = async (listingId) => {
    const isBookmarked = bookmarks.has(listingId);
    try {
      if (isBookmarked) {
        // Remove: look up the bookmark id, call DELETE, then update local state.
        const bookmarkId = bookmarkIds[listingId];
        if (bookmarkId !== undefined) {
          await removeBookmark(bookmarkId);
        }
        setBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
        setBookmarkIds((prev) => {
          const next = { ...prev };
          delete next[listingId];
          return next;
        });
      } else {
        // Add: call POST, then store the returned bookmark id.
        const created = await addBookmark(listingId);
        setBookmarks((prev) => new Set(prev).add(listingId));
        setBookmarkIds((prev) => ({ ...prev, [listingId]: created.id }));
      }
    } catch (err) {
      // 401 here almost always means "not logged in" (no token).
      console.error("Bookmark action failed:", err);
      alert("Please log in to save bookmarks.");
    }
  };

  // Mock current user (since we're skipping auth for now)
  const mockUser = {
    firstName: "Test",
    lastName: "User"
  };

  return (
    <div className={`app ${userMode}-mode`}>
      <aside className="sidebar" style={{ width: sidebarOpen ? 256 : 0 }}>
        <Sidebar
          currentUser={mockUser}
          userMode={userMode}
        />
      </aside>

      <div className="main">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="content">
          <Routes>
            {/* Redirect root to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Home page - listing feed */}
            <Route
              path="/home"
              element={
                <HomePage
                  bookmarks={bookmarks}
                  onBookmark={toggleBookmark}
                />
              }
            />

            {/* Listing detail page */}
            <Route
              path="/listing/:id"
              element={
                <ListingDetailPage
                  userMode={userMode}
                  onApply={() => setShowApplyModal(true)}
                />
              }
            />

            {/* Create listing page */}
            <Route path="/listing/create" element={<CreateListingPage />} />

            {/* User profile page */}
            <Route
              path="/user/profile"
              element={
                <UserProfileView
                  userMode={userMode}
                  onToggleMode={toggleUserMode}
                />
              }
            />

            {/* Bookmarks page */}
            <Route
              path="/user/bookmarks"
              element={
                <BookmarksPage
                  bookmarks={bookmarks}
                  onBookmark={toggleBookmark}
                />
              }
            />

            {/* Messages page */}
            <Route path="/messages" element={<MessagesView />} />
          </Routes>
        </div>
      </div>

      {showApplyModal && (
        <ApplicationModal listing={null} onClose={() => setShowApplyModal(false)} />
      )}

      {showAIModal && <AIAgentModal onClose={() => setShowAIModal(false)} />}
    </div>
  );
}

// Home Page Component
function HomePage({ bookmarks, onBookmark }) {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = searchParams.get('search') || '';

  useEffect(() => {
    let ignore = false;
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

    return () => { ignore = true; };
  }, [search]);

  return (
    <>
      {isLoading && <p className="feed-status">Loading listings…</p>}
      {error && <p className="feed-status feed-error">{error}</p>}
      <HomeView
        listings={listings}
        bookmarks={bookmarks}
        onBookmark={onBookmark}
      />
    </>
  );
}

// Listing Detail Page Component
function ListingDetailPage({ userMode, onApply }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getListingById(id)
      .then((data) => setListing(data))
      .catch((err) => {
        console.error("Failed to load listing:", err);
        setError("Could not load listing details.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <p className="feed-status">Loading listing details…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!listing) return <p className="feed-status feed-error">Listing not found</p>;

  return (
    <ListingDetailView
      listing={listing}
      userMode={userMode}
      onBack={() => navigate('/home')}
      onApply={onApply}
    />
  );
}

// Create Listing Page Component
function CreateListingPage() {
  const navigate = useNavigate();
  return <CreateListingView onDone={() => navigate('/home')} />;
}

// Bookmarks Page Component
// Fetches the user's saved bookmarks from the backend. Each bookmark comes with
// its full listing (and the listing's owner), so we render those listings.
function BookmarksPage({ bookmarks, onBookmark }) {
  const navigate = useNavigate();
  const [savedListings, setSavedListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Re-fetch whenever the set of bookmarks changes (e.g. user removes one here).
  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    getBookmarks()
      .then((data) => {
        // Each bookmark has a nested `listing`; pull those out to show as cards.
        if (!ignore) setSavedListings(data.map((b) => b.listing));
      })
      .catch((err) => console.error("Failed to load bookmarks:", err))
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [bookmarks]);

  if (isLoading) return <p className="feed-status">Loading bookmarks…</p>;

  return (
    <div className="home-wrap">
      <div className="listing-feed">
        {savedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            bookmarked={true}
            onBookmark={() => onBookmark(listing.id)}
            onClick={() => navigate(`/listing/${listing.id}`)}
          />
        ))}
        {savedListings.length === 0 && (
          <div className="empty-state">
            <Bookmark size={32} />
            <p>No bookmarks yet</p>
            <small>Save listings to find them here</small>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper to provide Router context
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWithRouter;
