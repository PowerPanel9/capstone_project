import { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import LogoMark from '../Logo/Logo';
import imgTaskLawn from '../../assets/landing_page_images/mowing-lawn.png';
import imgTaskCleaning from '../../assets/landing_page_images/painting.png';
import imgTaskExtra from '../../assets/landing_page_images/shopping-fixed.png';
import imgTaskNursing from '../../assets/landing_page_images/barber.png';
import imgTaskGroceries from '../../assets/landing_page_images/nails.png';
import imgTaskChildcare from '../../assets/landing_page_images/tutoring.png';
import imgTaskDogwalk from '../../assets/landing_page_images/pet-sit.png';
import imgTaskHandyman from '../../assets/landing_page_images/plumbing.png';
import imgTaskPetSitting from '../../assets/landing_page_images/moving-couch.png';

function LandingPage({ onOpenLogin, onOpenSignup }) {
  const [scrolled, setScrolled] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const elements = pageRef.current?.querySelectorAll('.reveal') ?? [];

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" ref={pageRef}>
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-left">
            <LogoMark size={36} />
            <div className="nav-brand">Side<span style={{ color: '#7B8FC8' }}>Hustle</span></div>
          </div>

          <ul className="nav-links">
          </ul>

          <div className="nav-right">
            <button className="btn-login" onClick={onOpenLogin}>
              Log in
            </button>
            <button className="btn-signup" onClick={onOpenSignup}>
              Sign up
            </button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-headline hero-fade" style={{ '--delay': '0.05s' }}>
            Earn extra income<br />
            or get tasks done -<br />
            <span>your choice.</span>
          </h1>
          <p className="hero-subheadline hero-fade" style={{ '--delay': '0.18s' }}>
            Connect with trusted local providers to check off your to-do list, or become a provider yourself and build a flexible business on your own schedule.
          </p>
          <div className="hero-buttons hero-fade" style={{ '--delay': '0.31s' }}>
            <button className="btn-join" onClick={onOpenSignup}>
              Join SideHustle for free
            </button>
            <button className="btn-account" onClick={onOpenLogin}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="hero-collage">
          <div className="collage-col" style={{ '--col-delay': '0.25s' }}>
            <img src={imgTaskLawn} alt="Lawn care" className="collage-img tall" />
            <img src={imgTaskCleaning} alt="Cleaning" className="collage-img medium" />
            <img src={imgTaskExtra} alt="Extra tasks" className="collage-img medium-tall" />
          </div>
          <div className="collage-col" style={{ '--col-delay': '0.4s' }}>
            <img src={imgTaskNursing} alt="Nursing" className="collage-img extra-tall" />
            <img src={imgTaskGroceries} alt="Groceries" className="collage-img medium-tall" />
            <img src={imgTaskChildcare} alt="Childcare" className="collage-img short" />
          </div>
          <div className="collage-col" style={{ '--col-delay': '0.55s' }}>
            <img src={imgTaskDogwalk} alt="Dog walking" className="collage-img medium-tall" />
            <img src={imgTaskHandyman} alt="Handyman" className="collage-img extra-tall" />
            <img src={imgTaskPetSitting} alt="Pet sitting" className="collage-img medium" />
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header reveal">
          <span className="section-badge">Step-by-step</span>
          <h2 className="section-title">How SideHustle works</h2>
          <p className="section-subtitle">
            Two simple paths - whether you need help or want to earn, we've got you covered.
          </p>
        </div>

        <div className="pathways">
          {/* For Clients */}
          <div className="pathway pathway-clients reveal">
            <div className="pathway-header">
              <span className="pathway-badge">For Clients</span>
              <h3 className="pathway-title">Get tasks done, stress-free</h3>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-number client-number">1</div>
                <div className="step-content">
                  <h4>Post a task</h4>
                  <p>Describe what you need done. Set your price.</p>
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
          <div className="pathway pathway-providers reveal">
            <div className="pathway-header">
              <span className="pathway-badge">For Providers</span>
              <h3 className="pathway-title">Earn on your own schedule</h3>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-number provider-number">1</div>
                <div className="step-content">
                  <h4>Build your profile</h4>
                  <p>List your skills, location, and set up your profile within minutes.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number provider-number">2</div>
                <div className="step-content">
                  <h4>Offer on local tasks</h4>
                  <p>Browse open listings nearby that fit your skills.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number provider-number">3</div>
                <div className="step-content">
                  <h4>Secure your earnings</h4>
                  <p>Complete the job, and withdraw your hard-earned funds securely.</p>
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
        <div className="footer-inner">
          <div className="footer-left">
            <LogoMark size={22} />
            <span>© 2026 SideHustle Inc.</span>
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
