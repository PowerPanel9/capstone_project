import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Clear old data first
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Save new token to localStorage
      localStorage.setItem('token', token);

      // Fetch user data with the token
      fetch('http://localhost:3000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          return response.json();
        })
        .then(userData => {
          console.log('Google OAuth user data:', userData);

          // Save user data to localStorage
          localStorage.setItem('user', JSON.stringify(userData));

          // Force a full page reload to refresh App.jsx state
          window.location.href = '/home';
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          // Clear the bad token
          localStorage.removeItem('token');
          navigate('/auth/failure');
        });
    } else {
      // No token in URL, redirect to failure
      navigate('/auth/failure');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: '20px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <h2 style={{ color: '#333', margin: 0 }}>Logging you in with Google...</h2>
      <p style={{ color: '#666', margin: 0 }}>Please wait a moment</p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuthSuccess;
