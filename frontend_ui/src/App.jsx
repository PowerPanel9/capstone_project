import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import HomeView from './components/HomeView/HomeView';
import ProvidersView from './components/ProvidersView/ProvidersView';
import ListingDetailView from './components/ListingDetailView/ListingDetailView';
import MessagesView from './components/MessagesView/MessagesView';
import UserProfileView from './components/UserProfileView/UserProfileView';
import PublicProfileView from './components/PublicProfileView/PublicProfileView';
import ExperienceDetailView from './components/ExperienceDetailView/ExperienceDetailView';
import CreateListingView from './components/CreateListingView/CreateListingView';
import ApplicationModal from './components/ApplicationModal/ApplicationModal';
import AIAgentModal from './components/AIAgentModal/AIAgentModal';
import LandingPage from './components/LandingPage/LandingPage';
import AuthModal from './components/AuthModal/AuthModal';
import RoleSelection from './components/Onboarding/RoleSelection';
import ProfileSetup from './components/Onboarding/ProfileSetup';
import ProviderServices from './components/Onboarding/ProviderServices';
import ProviderBuild from './components/Onboarding/ProviderBuild';
import Welcome from './components/Onboarding/Welcome';
import AuthSuccess from './components/AuthSuccess';
import AuthFailure from './components/AuthFailure';
import ConnectReturn from './components/ConnectOnboarding/ConnectReturn';
import ListingCard from './components/ListingCard/ListingCard';
import { getExperiences } from './api/experiences';
import { getProviders } from './api/users';
import { getListings, getListingById, deleteListing } from './api/listings';
import { getRecommendedListings } from './api/recommendations';
import { getBookmarks, addBookmark, removeBookmark } from './api/bookmarks';
import { getMyApplications } from './api/applications';
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
  const [applyListing, setApplyListing] = useState(null); // the listing being applied to
  // Listing ids the user has just applied to during this session. We use this
  // to instantly flip the "Apply Now" button to "Applied" without a reload.
  const [appliedListingIds, setAppliedListingIds] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  // Text to prefill the AI chat box with (used when "Ask AI" is clicked with a
  // typed query). Empty string means open the modal with a blank box.
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  // Sidebar starts open on desktop, but closed on tablet/mobile (≤1024px) so it
  // doesn't cover the page on load. On small screens it opens as an overlay.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [messagesComposerOpen, setMessagesComposerOpen] = useState(false);
  const [messagesPeopleSearch, setMessagesPeopleSearch] = useState("");
  const [messagesDirectoryUsers, setMessagesDirectoryUsers] = useState([]);
  const [messagesStartUser, setMessagesStartUser] = useState(null);
  // The listing a provider is messaging about (carried from the listing page).
  const [messagesStartListing, setMessagesStartListing] = useState(null);
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

  // Pick which view a user lands in based on the role they signed up as.
  // CLIENT starts in the client view; PROVIDER and BOTH start in the provider view.
  const modeForRole = (role) => (role === 'CLIENT' ? 'client' : 'provider');

  // Toggle between client and provider mode.
  // A BOTH user has both views, so the toggle simply flips between them.
  // A single-role user (CLIENT-only or PROVIDER-only) doesn't have the other
  // view yet, so instead of silently switching we send them to onboarding to
  // sign up for the other role.
  const toggleUserMode = () => {
    if (currentUser?.role === 'BOTH') {
      const newMode = userMode === 'client' ? 'provider' : 'client';
      setUserMode(newMode);
      localStorage.setItem('sideHustleUserMode', newMode);
      return;
    }
    // NOTE: /onboarding/role is Zainab's onboarding wizard (PR 2). Until that
    // route is added it falls through to the catch-all and returns home.
    navigate('/onboarding/role');
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

  // Handle successful login/signup.
  // A brand-new signup has just been created with the default role, so we send
  // them into the onboarding flow to pick a role and fill in their profile.
  // A returning login already finished onboarding, so they go straight home.
  const handleAuthSuccess = (userData, { isNewSignup = false } = {}) => {
    // AuthModal already saves to localStorage, just update state
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setAuthMode(null);

    // A brand-new signup hasn't picked a role yet, so send them into the
    // onboarding flow. Their view mode is set at the end of onboarding
    // (see handleFinishOnboarding), once they've chosen a role.
    if (isNewSignup) {
      navigate('/onboarding/role');
      return;
    }

    // A returning login already has a role, so land them in the matching view.
    const mode = modeForRole(userData?.role);
    setUserMode(mode);
    localStorage.setItem('sideHustleUserMode', mode);
    navigate('/home');
  };

  // Called by each onboarding page after it saves. The backend returns the
  // updated user, and we keep both App state and localStorage in sync so the
  // profile and later pages see the new values.
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Called from the final Welcome page. It sets the view mode ("client" or
  // "provider") to match the role the user picked so they land in the right view.
  const handleFinishOnboarding = (mode) => {
    setUserMode(mode);
    localStorage.setItem('sideHustleUserMode', mode);
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

  // Onboarding pages are full-screen wizards, so they don't get the sidebar/topbar.
  const isOnboarding = location.pathname.startsWith('/onboarding');
  // Determine if we should show the main app layout (sidebar + topbar)
  const showMainLayout = isAuthenticated && location.pathname !== '/' && !isOnboarding;
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
          <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Sidebar
              currentUser={currentUser}
              userMode={userMode}
              onOpenAI={openAI}
              onLogout={handleLogout}
            />
          </aside>

          {/* Dark backdrop behind the sidebar when it's open as an overlay on
              tablet/mobile. Tapping it closes the sidebar. Hidden on desktop
              via CSS (the sidebar isn't an overlay there). */}
          {sidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="main">
            <TopBar
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onLogout={handleLogout}
              userMode={userMode}
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
                      <HomePage bookmarks={bookmarks} onBookmark={toggleBookmark} userMode={userMode} onOpenAI={openAI} currentUserId={currentUserId} />
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
                        appliedListingIds={appliedListingIds}
                        onApply={(listing) => {
                          setApplyListing(listing);
                          setShowApplyModal(true);
                        }}
                        onMessageUser={setMessagesStartUser}
                        onMessageListing={setMessagesStartListing}
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
                        onLogout={handleLogout}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/users/:userId"
                  element={
                    isAuthenticated ? (
                      <PublicProfileView currentUser={currentUser} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/experiences/:id"
                  element={
                    isAuthenticated ? (
                      <ExperienceDetailView />
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
                        startListing={messagesStartListing}
                        onStartConversationHandled={() => {
                          setMessagesStartUser(null);
                          setMessagesStartListing(null);
                        }}
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
            <ApplicationModal
              listing={applyListing}
              currentUser={currentUser}
              onClose={() => setShowApplyModal(false)}
              onSuccess={() => {
                // Remember this listing as applied so its button flips to
                // "Applied" right away, without needing a page reload.
                if (applyListing?.id != null) {
                  setAppliedListingIds((prev) =>
                    prev.includes(applyListing.id) ? prev : [...prev, applyListing.id]
                  );
                }
              }}
            />
          )}

          {showAIModal && (
            <AIAgentModal
              initialMessage={aiInitialMessage}
              onClose={() => setShowAIModal(false)}
            />
          )}
        </div>
      ) : isOnboarding ? (
        // Onboarding wizard - full-screen, no sidebar/topbar. Only for logged-in
        // users; anyone else is bounced to the landing page.
        <Routes>
          <Route
            path="/onboarding/role"
            element={
              isAuthenticated ? (
                <RoleSelection currentUser={currentUser} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/onboarding/profile"
            element={
              isAuthenticated ? (
                <ProfileSetup currentUser={currentUser} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/onboarding/services"
            element={
              isAuthenticated ? (
                <ProviderServices currentUser={currentUser} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/onboarding/build"
            element={
              isAuthenticated ? (
                <ProviderBuild currentUser={currentUser} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/onboarding/welcome"
            element={
              isAuthenticated ? (
                <Welcome currentUser={currentUser} onFinish={handleFinishOnboarding} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
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
          {/* Stripe Connect onboarding redirects land here. */}
          <Route path="/connect/return" element={<ConnectReturn />} />
          <Route path="/connect/refresh" element={<ConnectReturn />} />
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
function HomePage({ bookmarks, onBookmark, userMode, onOpenAI, currentUserId }) {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [experiences, setExperiences] = useState([]); // experience cards for the client home feed
  const [providers, setProviders] = useState([]); // providers shown when a client picks a category
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);   // first page / new search
  const [isLoadingMore, setIsLoadingMore] = useState(false); // extra pages
  const [error, setError] = useState(null);
  // True when the backend actually AI-ranked the feed (vs. the normal feed).
  const [personalized, setPersonalized] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  // In client mode, once a category is picked we show the PROVIDERS who offer
  // that service (so a client can browse and contact them).
  const showProviders = userMode === 'client' && Boolean(category);

  // In client mode with no category chosen, the home feed shows a grid of
  // EXPERIENCES people posted (in a random order), instead of listings.
  // In provider mode we always show the normal listings feed.
  const showExperiences = userMode === 'client' && !showProviders;

  // When the mode or search changes, load fresh results.
  // The landing page (no category chosen, no search) shows category tiles plus
  // a "Recommended for you" strip. Once a category is picked, we switch to the
  // normal feed filtered by that category.
  const isLanding = !category && !search;

  // Providers get a personalized, AI-ranked feed — but only on the landing page.
  // When browsing a category or searching, we show the plain (filtered) feed.
  const usePersonalized = userMode === 'provider' && isLanding;

  // Client picked a category: load the providers who offer that service.
  // This is its own effect so it doesn't tangle with the listings/experiences
  // feed logic below. `currentUserId` is passed as excludeId so a client who is
  // also a provider (role BOTH) doesn't see themselves in the list.
  useEffect(() => {
    if (!showProviders) return;
    let ignore = false;
    setIsLoadingProviders(true);
    setError(null);
    getProviders({ category, excludeId: currentUserId })
      .then((list) => {
        if (!ignore) setProviders(list);
      })
      .catch((err) => {
        console.error("Failed to load providers:", err);
        if (!ignore) setError("Could not load providers. Is the backend running?");
      })
      .finally(() => {
        if (!ignore) setIsLoadingProviders(false);
      });
    return () => { ignore = true; };
  }, [showProviders, category, currentUserId]);

  // When the search or role changes, start over: clear listings and load page 1.
  useEffect(() => {
    // When showing providers, the effect above handles loading, so skip this one.
    if (showProviders) return;
    let ignore = false;
    setIsLoading(true);
    setError(null);

    // Client mode: the home feed shows a random grid of EXPERIENCES. The
    // backend already shuffles them, so a new order shows on each load. When a
    // category tile is clicked (?category=VALUE), we ask for only that
    // category. We only keep experiences that have at least one image, since
    // this is a visual grid (text-only posts are hidden here). The full list
    // comes at once, so there are no extra pages to load.
    if (showExperiences) {
      getExperiences({ category })
        .then((list) => {
          if (ignore) return;
          const withImages = list.filter(
            (exp) => Array.isArray(exp.images) && exp.images.length > 0
          );
          setExperiences(withImages);
          setHasMore(false);
        })
        .catch((err) => {
          console.error("Failed to load experiences:", err);
          if (!ignore) setError("Could not load experiences. Is the backend running?");
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });

      return () => { ignore = true; };
    }

    // Provider mode, landing page: try the personalized AI-ranked feed first.
    // If it fails (or isn't personalized), fall back to the normal newest-first
    // feed so the home page always shows something.
    if (usePersonalized) {
      getRecommendedListings()
        .then((data) => {
          if (ignore) return;
          setListings(data.listings);
          setHasMore(false); // recommendations come as one ranked batch
          setPage(1);
          // The backend tells us whether it actually AI-ranked the feed.
          setPersonalized(Boolean(data.personalized));
        })
        .catch((err) => {
          console.error("Personalized feed failed, using normal feed:", err);
          setPersonalized(false);
          // Fall back to the normal feed.
          return getListings({ search, category, page: 1 }).then((data) => {
            if (ignore) return;
            setListings(data.listings);
            setHasMore(data.hasMore);
            setPage(1);
          });
        })
        .catch((err) => {
          console.error("Failed to load listings:", err);
          if (!ignore) setError("Could not load listings. Is the backend running?");
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });

      return () => { ignore = true; };
    }

    // Provider mode, browsing a category or searching: the plain listings feed.
    setPersonalized(false); // normal feed is not AI-ranked
    getListings({ search, category, page: 1 })
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
  }, [search, category, showExperiences, usePersonalized, currentUserId, showProviders]);

  // Load the next page and append it to the list. Called when the user scrolls
  // to the bottom. Guarded so we don't fire while a load is already happening
  // or when there's nothing left to load.
  const loadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    if (showExperiences) return; // experiences are returned all at once

    const nextPage = page + 1;
    setIsLoadingMore(true);
    getListings({ search, category, page: nextPage })
      .then((data) => {
        setListings((prev) => [...prev, ...data.listings]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      })
      .catch((err) => console.error("Failed to load more listings:", err))
      .finally(() => setIsLoadingMore(false));
  };

  // Client picked a category: show the providers who offer that service.
  if (showProviders) {
    return (
      <>
        {error && <p className="feed-status feed-error">{error}</p>}
        <ProvidersView
          providers={providers}
          category={category}
          isLoading={isLoadingProviders}
        />
      </>
    );
  }

  return (
    <>
      {isLoading && (
        <p className="feed-status">
          {showExperiences ? "Loading experiences…" : "Loading listings…"}
        </p>
      )}
      {error && <p className="feed-status feed-error">{error}</p>}
      <HomeView
        listings={listings}
        experiences={experiences}
        showExperiences={showExperiences}
        bookmarks={bookmarks}
        onBookmark={onBookmark}
        userMode={userMode}
        onOpenAI={onOpenAI}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        personalized={personalized}
        usePersonalized={usePersonalized}
        category={category}
        showCategories={isLanding}
      />
    </>
  );
}

// Listing Detail Page Component
function ListingDetailPage({ userMode, appliedListingIds = [], onApply, onMessageUser, onMessageListing }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // If we arrived here from the profile, the navigation carried this marker.
  // Use it to decide where "back" goes and what the button says.
  const cameFromProfile = location.state?.from === "profile";
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Whether the logged-in user has already applied to this listing (checked
  // against the server on load). Used to show "Applied" instead of "Apply Now".
  const [appliedFromServer, setAppliedFromServer] = useState(false);

  useEffect(() => {
    getListingById(id)
      .then((data) => setListing(data))
      .catch((err) => {
        console.error("Failed to load listing:", err);
        setError("Could not load listing details.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // Ask the backend which listings this user already applied to, then check if
  // the current listing is one of them. This keeps "Applied" correct even after
  // a page reload (App-level state resets, but the server remembers).
  useEffect(() => {
    getMyApplications()
      .then((applications) => {
        const alreadyApplied = applications.some(
          (application) => Number(application.listingId) === Number(id)
        );
        setAppliedFromServer(alreadyApplied);
      })
      .catch((err) => {
        console.error("Failed to load your applications:", err);
      });
  }, [id]);

  // Work out if the logged-in user owns this listing. The user object was
  // saved to localStorage at login, and each listing carries its owner's id.
  let currentUserId = null;
  try {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    currentUserId = savedUser?.id ?? null;
  } catch (err) {
    currentUserId = null;
  }
  const isOwner =
    listing != null && currentUserId != null && Number(listing.userId) === Number(currentUserId);

  // Delete this listing (owner only), then go back to the home feed since
  // the listing no longer exists. The "are you sure?" step is handled by an
  // in-app modal inside ListingDetailView, so we no longer use window.confirm.
  const handleDelete = async () => {
    try {
      await deleteListing(id);
      navigate('/home');
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setError("Could not delete this listing. Please try again.");
    }
  };

  // Open a conversation with the client who posted this listing. We hand the
  // listing's owner up to App (which stores it as messagesStartUser) and then
  // navigate to Messages, where that conversation opens automatically.
  const handleMessage = () => {
    if (!listing?.user?.id) return;
    onMessageUser?.(listing.user);
    // Also carry the listing itself so Messages can attach it to the first message.
    onMessageListing?.({ id: listing.id, title: listing.title });
    navigate('/messages');
  };

  if (isLoading) return <p className="feed-status">Loading listing details…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!listing) return <p className="feed-status feed-error">Listing not found</p>;

  // The user has applied if the server says so OR they just applied in this
  // session (the App tracks that in appliedListingIds for an instant update).
  const hasApplied =
    appliedFromServer || appliedListingIds.some((appliedId) => Number(appliedId) === Number(id));

  return (
    <ListingDetailView
      listing={listing}
      userMode={userMode}
      isOwner={isOwner}
      hasApplied={hasApplied}
      onBack={() => navigate(-1)}
      onApply={() => onApply(listing)}
      onDelete={handleDelete}
      onMessage={handleMessage}
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

  // When there are no bookmarks, show the empty state on its own (outside the
  // masonry column layout) so it centers across the full page width.
  if (savedListings.length === 0) {
    return (
      <div className="home-wrap">
        <div className="empty-state">
          <Bookmark size={32} />
          <p>No bookmarks yet</p>
          <small>Save listings to find them here</small>
        </div>
      </div>
    );
  }

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
            userMode="client"
          />
        ))}
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
  