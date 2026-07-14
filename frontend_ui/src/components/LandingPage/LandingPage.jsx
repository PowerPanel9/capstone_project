import './LandingPage.css';

// Image URLs from Figma
const imgTaskLawn = "https://www.figma.com/api/mcp/asset/2bba32b2-1634-4e6a-9a13-2d79f553b9ae";
const imgTaskCleaning = "https://www.figma.com/api/mcp/asset/1c159b3f-56e8-45f8-baa7-1ca4dcb1c04f";
const imgTaskExtra = "https://www.figma.com/api/mcp/asset/70bb4f3b-b413-4478-a087-fae9a190ee35";
const imgTaskNursing = "https://www.figma.com/api/mcp/asset/d4697ac7-7eae-4af3-81de-826486210304";
const imgTaskGroceries = "https://www.figma.com/api/mcp/asset/68cdf121-6d16-46e7-a14b-b389bb372ea1";
const imgTaskChildcare = "https://www.figma.com/api/mcp/asset/c9701fc0-dd76-4839-9edf-f63bd4549252";
const imgTaskDogwalk = "https://www.figma.com/api/mcp/asset/2a2311a0-6fd5-468e-9e2f-0e48f880cfff";
const imgTaskHandyman = "https://www.figma.com/api/mcp/asset/2dbc2b30-2029-404f-997a-df5fee22e733";
const imgTaskPetSitting = "https://www.figma.com/api/mcp/asset/705fb4a5-9758-45e4-b9ae-9a91845f4e2b";

function LandingPage({ onOpenLogin, onOpenSignup }) {
  return (
    <div className="landing-page">
      {/* NAVIGATION */}
      <nav className="nav">
        <div className="nav-left">
          <div className="nav-logo">S</div>
          <div className="nav-brand">SideHustle</div>
        </div>

        <ul className="nav-links">
          <li><a href="#features">Find Help</a></li>
          <li><a href="#how-it-works">Earn Money</a></li>
          <li><a href="#about">Safety & Trust</a></li>
        </ul>

        <div className="nav-right">
          <button className="btn-login" onClick={onOpenLogin}>
            Log in
          </button>
          <button className="btn-signup" onClick={onOpenSignup}>
            Sign up
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-headline">
            Earn extra income<br />
            or get tasks done -<br />
            <span>your choice.</span>
          </h1>
          <p className="hero-subheadline">
            Connect with trusted local providers to check off your to-do list, or become a provider yourself and build a flexible business on your own schedule.
          </p>
          <div className="hero-buttons">
            <button className="btn-join" onClick={onOpenSignup}>
              Join SideHustle for free
            </button>
            <button className="btn-account" onClick={onOpenLogin}>
              I already have an account
            </button>
          </div>
        </div>

        {/* HERO COLLAGE */}
        <div className="hero-collage">
          <div className="collage-col">
            <img src={imgTaskLawn} alt="Lawn care" className="collage-img tall" />
            <img src={imgTaskCleaning} alt="Cleaning" className="collage-img medium" />
            <img src={imgTaskExtra} alt="Extra tasks" className="collage-img medium-tall" />
          </div>
          <div className="collage-col">
            <img src={imgTaskNursing} alt="Nursing" className="collage-img extra-tall" />
            <img src={imgTaskGroceries} alt="Groceries" className="collage-img medium-tall" />
            <img src={imgTaskChildcare} alt="Childcare" className="collage-img short" />
          </div>
          <div className="collage-col">
            <img src={imgTaskDogwalk} alt="Dog walking" className="collage-img medium-tall" />
            <img src={imgTaskHandyman} alt="Handyman" className="collage-img extra-tall" />
            <img src={imgTaskPetSitting} alt="Pet sitting" className="collage-img medium" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="section-header">
          <span className="section-badge">Step-by-step</span>
          <h2 className="section-title">How SideHustle works</h2>
          <p className="section-subtitle">
            Two simple paths - whether you need help or want to earn, we've got you covered.
          </p>
        </div>

        <div className="pathways">
          {/* For Clients */}
          <div className="pathway pathway-clients">
            <div className="pathway-header">
              <span className="pathway-badge">For Clients</span>
              <h3 className="pathway-title">Get tasks done, stress-free</h3>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-number client-number">1</div>
                <div className="step-content">
                  <h4>Post a task</h4>
                  <p>Describe what you need done. Set your date, time, and estimated budget.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number client-number">2</div>
                <div className="step-content">
                  <h4>Choose a provider</h4>
                  <p>Review offers from qualified local helpers, checking their reviews and ratings.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number client-number">3</div>
                <div className="step-content">
                  <h4>Get it done & pay safely</h4>
                  <p>Your task is completed, and funds are released only when you're 100% satisfied.</p>
                </div>
              </div>
            </div>
            <button className="pathway-cta client-cta" onClick={onOpenSignup}>
              Post a task now
            </button>
          </div>

          {/* For Providers */}
          <div className="pathway pathway-providers">
            <div className="pathway-header">
              <span className="pathway-badge">For Providers</span>
              <h3 className="pathway-title">Earn on your own schedule</h3>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-number provider-number">1</div>
                <div className="step-content">
                  <h4>Build your profile</h4>
                  <p>List your skills, location, and set up your verified profile within minutes.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number provider-number">2</div>
                <div className="step-content">
                  <h4>Offer on local tasks</h4>
                  <p>Browse open tasks nearby that fit your skills and send custom quotes directly.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number provider-number">3</div>
                <div className="step-content">
                  <h4>Secure your earnings</h4>
                  <p>Complete the job, upload proof, and withdraw your hard-earned funds securely.</p>
                </div>
              </div>
            </div>
            <button className="pathway-cta provider-cta" onClick={onOpenSignup}>
              Start earning today
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-left">
          <div className="footer-logo">S</div>
          <span>© 2026 SideHustle Inc.</span>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
