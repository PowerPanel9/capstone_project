import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

function AuthFailure() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: '20px',
      padding: '20px'
    }}>
      <XCircle size={64} color="#ef4444" />

      <h2 style={{ color: '#333', margin: 0 }}>Authentication Failed</h2>

      <p style={{ color: '#666', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
        Something went wrong while trying to log you in with Google.
        Please try again.
      </p>

      <button
        onClick={() => navigate('/')}
        style={{
          backgroundColor: '#6366f1',
          color: 'white',
          padding: '12px 32px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
      >
        Back to Login
      </button>
    </div>
  );
}

export default AuthFailure;
