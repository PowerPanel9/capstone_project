import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import HomeView from './components/HomeView/HomeView';
import ListingDetailView from './components/ListingDetailView/ListingDetailView';
import MessagesView from './components/MessagesView/MessagesView';
import UserProfileView from './components/UserProfileView/UserProfileView';
import CreateListingView from './components/CreateListingView/CreateListingView';
import ApplicationModal from './components/ApplicationModal/ApplicationModal';
import AIAgentModal from './components/AIAgentModal/AIAgentModal';
import LandingPage from './components/LandingPage/LandingPage';
import AuthModal from './components/AuthModal/AuthModal';
import AuthSuccess from './components/AuthSuccess';
import AuthFailure from './components/AuthFailure';
import ListingCard from './components/ListingCard/ListingCard';
import { getListings, getListingById } from './api/listings';
import { getBookmarks, addBookmark, removeBookmark } from './api/bookmarks';
import { getUsers as getMessageUsers } from './api/messages';
import { Bookmark } from 'lucide-react';
import './App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  // Text to prefill the AI chat box with (used when "Ask AI" is clicked with a
  // typed query). Empty string means open the modal with a blank box.
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messagesComposerOpen, setMessagesComposerOpen] = useState(false);
  const [messagesPeopleSearch, setMessagesPeopleSearch] = useState("");
  const [messagesDirectoryUsers, setMessagesDirectoryUsers] = useState([]);
  const [messagesStartUser, setMessagesStartUser] = useState(null);
  // `bookmarks` is a Set of LISTING ids (used by cards to show the filled icon).
  const [bookmarks, setBookmarks] = useState(new Set());
  // The backend deletes by BOOKMARK id, but the UI works in listing ids, so we
  // keep a map of listingId -> bookmarkId to know what to delete.
  const [bookmarkIds, setBookmarkIds] = useState({});
  const [userMode, setUserMode] = useState("provider");
  const [authMode, setAuthMode] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Mark auth check as complete
    setAuthLoading(false);
  }, []);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('sideHustleUserMode');
    if (savedMode) {
      setUserMode(savedMode);
    }
  }, []);

  // Load the logged-in user's bookmarks from the backend on mount.
  // If nobody is logged in, getBookmarks() returns [] so this is a safe no-op.
  useEffect(() => {
    getBookmarks()
      .then((data) => {
        const safeBookmarks = Array.isArray(data) ? data : [];
        setBookmarks(new Set(safeBookmarks.map((b) => b.listingId)));
        const map = {};
        safeBookmarks.forEach((b) => { map[b.listingId] = b.id; });
        setBookmarkIds(map);
      })
      .catch((err) => console.error("Failed to load bookmarks:", err));
  }, []);

  // Toggle between client and provider mode
  const toggleUserMode = () => {
    const newMode = userMode === 'client' ? 'provider' : 'client';
    setUserMode(newMode);
    localStorage.setItem('sideHustleUserMode', newMode);
  };

  // Open the AI chat modal. An optional message prefills the input box (used by
  // the "Ask AI" bar so the user's typed query carries into the chat).
  const openAI = (message = "") => {
    setAiInitialMessage(message);
    setShowAIModal(true);
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

  // Handle successful login/signup
  const handleAuthSuccess = (userData) => {
    // AuthModal already saves to localStorage, just update state
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setAuthMode(null);
    navigate('/home');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('sidehustle_chat_session'); // Clear chat history on logout
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/');
  };

  // Determine if we should show the main app layout (sidebar + topbar)
  const showMainLayout = isAuthenticated && location.pathname !== '/';
  const isMessagesRoute = location.pathname === "/messages";
  const currentUserId = Number(currentUser?.id) || null;

  useEffect(() => {
    if (!isMessagesRoute || !messagesComposerOpen) return;
    let ignore = false;
    getMessageUsers()
      .then((users) => {
        if (!ignore) setMessagesDirectoryUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => {
        if (!ignore) setMessagesDirectoryUsers([]);
      });
    return () => {
      ignore = true;
    };
  }, [isMessagesRoute, messagesComposerOpen]);

  const messagesPeopleResults = useMemo(() => {
    const q = String(messagesPeopleSearch || "").trim().toLowerCase();
    if (!q || !messagesComposerOpen || !isMessagesRoute) return [];
    return messagesDirectoryUsers.filter((user) => {
      if (!user || user.id === currentUserId) return false;
      const full = `${String(user.firstName || "").toLowerCase()} ${String(user.lastName || "").toLowerCase()}`.trim();
      return full.includes(q);
    });
  }, [messagesPeopleSearch, messagesComposerOpen, isMessagesRoute, messagesDirectoryUsers, currentUserId]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {showMainLayout ? (
        // Main app layout with sidebar and topbar
        <div className={`app ${userMode}-mode`}>
          <aside className="sidebar" style={{ width: sidebarOpen ? 256 : 0 }}>
            <Sidebar
              currentUser={currentUser}
              userMode={userMode}
              onOpenAI={openAI}
            />
          </aside>

          <div className="main">
            <TopBar
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onLogout={handleLogout}
              messagesComposerOpen={messagesComposerOpen}
              onToggleMessagesComposer={() => {
                setMessagesComposerOpen((prev) => {
                  const next = !prev;
                  if (!next) setMessagesPeopleSearch("");
                  return next;
                });
              }}
              messagesPeopleSearch={messagesPeopleSearch}
              onMessagesPeopleSearchChange={setMessagesPeopleSearch}
              messagesPeopleResults={messagesPeopleResults}
              onSelectMessagesPerson={(user) => {
                setMessagesStartUser(user);
                setMessagesComposerOpen(false);
                setMessagesPeopleSearch("");
              }}
            />

            <div className="content">
              <Routes>
                {/* Protected routes - redirect to landing if not authenticated */}
                <Route
                  path="/home"
                  element={
                    isAuthenticated ? (
                      <HomePage bookmarks={bookmarks} onBookmark={toggleBookmark} userMode={userMode} onOpenAI={openAI} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/listing/:id"
                  element={
                    isAuthenticated ? (
                      <ListingDetailPage
                        userMode={userMode}
                        onApply={() => setShowApplyModal(true)}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/listing/create"
                  element={
                    isAuthenticated ? (
                      <CreateListingPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/user/profile"
                  element={
                    isAuthenticated ? (
                      <UserProfileView
                        userMode={userMode}
                        onToggleMode={toggleUserMode}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/user/bookmarks"
                  element={
                    isAuthenticated ? (
                      <BookmarksPage bookmarks={bookmarks} onBookmark={toggleBookmark} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/messages"
                  element={
                    isAuthenticated ? (
                      <MessagesView
                        composerOpen={messagesComposerOpen}
                        peopleSearch={messagesPeopleSearch}
                        onPeopleSearchChange={setMessagesPeopleSearch}
                        startConversationUser={messagesStartUser}
                        onStartConversationHandled={() => setMessagesStartUser(null)}
                        onCloseComposer={() => {
                          setMessagesComposerOpen(false);
                          setMessagesPeopleSearch("");
                        }}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                {/* Catch-all route - redirect to home if authenticated, landing if not */}
                <Route
                  path="*"
                  element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />}
                />
              </Routes>
            </div>
          </div>

          {/* Modals */}
          {showApplyModal && (
            <ApplicationModal listing={null} onClose={() => setShowApplyModal(false)} />
          )}

          {showAIModal && (
            <AIAgentModal
              initialMessage={aiInitialMessage}
              onClose={() => setShowAIModal(false)}
            />
          )}
        </div>
      ) : (
        // Landing page - shown when not authenticated
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                onOpenLogin={() => setAuthMode('login')}
                onOpenSignup={() => setAuthMode('signup')}
              />
            }
          />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/auth/failure" element={<AuthFailure />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {/* Auth modal - shown outside main layout */}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={handleAuthSuccess}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        />
      )}
    </>
  );
}

// Home Page Component
function HomePage({ bookmarks, onBookmark, userMode, onOpenAI }) {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);   // first page / new search
  const [isLoadingMore, setIsLoadingMore] = useState(false); // extra pages
  const [error, setError] = useState(null);

  const search = searchParams.get('search') || '';

  // When the search changes, start over: clear listings and load page 1.
  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    getListings({ search, page: 1 })
      .then((data) => {
        if (ignore) return;
        setListings(data.listings);
        setHasMore(data.hasMore);
        setPage(1);
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

  // Load the next page and append it to the list. Called when the user scrolls
  // to the bottom. Guarded so we don't fire while a load is already happening
  // or when there's nothing left to load.
  const loadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    getListings({ search, page: nextPage })
      .then((data) => {
        setListings((prev) => [...prev, ...data.listings]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      })
      .catch((err) => console.error("Failed to load more listings:", err))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <>
      {isLoading && <p className="feed-status">Loading listings…</p>}
      {error && <p className="feed-status feed-error">{error}</p>}
      <HomeView
        listings={listings}
        bookmarks={bookmarks}
        onBookmark={onBookmark}
        userMode={userMode}
        onOpenAI={onOpenAI}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
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
        const safeBookmarks = Array.isArray(data) ? data : [];
        // Each bookmark has a nested `listing`; pull those out to show as cards.
        if (!ignore) setSavedListings(safeBookmarks.map((b) => b.listing).filter(Boolean));
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
            userMode="provider"
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
  