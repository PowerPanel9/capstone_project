// OnboardingChrome: the shared page frame every onboarding step sits inside.
// It draws the top nav bar and the footer (which are the same on every page,
// except the "track" label and the accent colour), and renders the page's own
// content in the middle via {children}.
//
// Props:
//   accent -> hex colour for the logo badges (teal for client, purple for provider)
//   track  -> the small nav label, e.g. "Client Success Track"
//   children -> the page-specific content
import './Onboarding.css';

function OnboardingChrome({ accent, track, children }) {
  return (
    <div className="onboarding-page">
      {/* Top navigation bar */}
      <nav className="onboarding-nav">
        <div className="onboarding-logo">
          <div className="onboarding-logo-mark" style={{ background: accent }}>S</div>
          <span className="onboarding-logo-name">SideHustle</span>
        </div>
        <span className="onboarding-nav-track">Onboarding Portal · {track}</span>
        <button type="button" className="onboarding-nav-btn">Support</button>
      </nav>

      {/* The page's own content goes here */}
      <div className="onboarding-content">{children}</div>

      {/* Footer */}
      <footer className="onboarding-footer">
        <div className="onboarding-footer-left">
          <div className="onboarding-footer-mark" style={{ background: accent }}>S</div>
          <span>© 2026 SideHustle Inc.</span>
        </div>
        <div className="onboarding-footer-links">
          <span>About</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </footer>
    </div>
  );
}

export default OnboardingChrome;
