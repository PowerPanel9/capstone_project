import { useState } from 'react';
import { X } from 'lucide-react';
import emailjs from '@emailjs/browser';
import './AuthModal.css';

function AuthModal({ mode, onClose, onSuccess, onSwitchMode }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'https://capstone-project-os7l.onrender.com'
      : 'http://localhost:3000');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email-verification state (only used during Sign Up).
  // We move to the "verify" step after emailing a code, then check what
  // the user types before we actually create their account.
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [sentCode, setSentCode] = useState(''); // the code we emailed
  const [enteredCode, setEnteredCode] = useState(''); // what the user types back

  const isLogin = mode === 'login';

  // Calls the backend to actually create the account (or log in) and hands
  // the token/user back up to App. Shared by login and by verified signups.
  const finishAuth = async (endpoint, body, isNewSignup) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Call success callback. Signups (not logins) go through onboarding,
    // so tell App which one this was.
    onSuccess(data.user, { isNewSignup });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login: create session right away, no email verification needed.
      if (isLogin) {
        await finishAuth(
          '/api/auth/login',
          { email: formData.email, password: formData.password },
          false
        );
        return;
      }

      // Sign Up: don't create the account yet. First make a 6-digit code,
      // email it to the address they typed, and switch to the verify step.
      // Math.floor(Math.random() * 900000) + 100000 => always 6 digits.
      const code = String(Math.floor(Math.random() * 900000) + 100000);
      setSentCode(code);

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          // These names must match the {{blanks}} in the EmailJS template.
          to_email: formData.email,
          to_name: formData.firstName,
          code: code,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setStep('verify');
    } catch (err) {
      // EmailJS errors put the message on err.text; fall back to err.message.
      setError(err.text || err.message || 'Could not send verification email');
    } finally {
      setLoading(false);
    }
  };

  // Second step of Sign Up: check the typed code, then create the account.
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    // The code the user typed must match the one we emailed.
    if (enteredCode.trim() !== sentCode) {
      setError('That code is incorrect. Please check your email and try again.');
      return;
    }

    setLoading(true);
    try {
      await finishAuth('/api/auth/register', formData, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h2>
            {step === 'verify'
              ? 'Verify Your Email'
              : isLogin
                ? 'Welcome Back'
                : 'Create Account'}
          </h2>
          <p>
            {step === 'verify'
              ? `We emailed a 6-digit code to ${formData.email}`
              : isLogin
                ? 'Log in to continue'
                : 'Sign up to get started'}
          </p>
        </div>

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                name="code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                required
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
              <small className="form-hint">
                Check your inbox (and spam folder) for the code.
              </small>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setEnteredCode('');
                setError('');
              }}
              className="auth-switch-btn"
              style={{ marginTop: '12px' }}
            >
              ← Back
            </button>
          </form>
        ) : (
        <>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength={8}
            />
            {!isLogin && (
              <small className="form-hint">At least 8 characters</small>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <a
          href={`${API_BASE_URL}/api/auth/google`}
          className="auth-google-btn"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={onSwitchMode} className="auth-switch-btn">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
