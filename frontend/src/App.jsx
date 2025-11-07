import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import VoterRegistration from './components/VoterRegistration';
import VoterLogin from './components/VoterLogin';
import VotingPage from './components/VotingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ElectionManagement from './components/ElectionManagement';  // ✅ added
import VoteVerification from './components/VoteVerification';

function App() {
  const isAdmin = localStorage.getItem('user_type') === 'ADMIN';
  const isVoter = localStorage.getItem('user_type') === 'VOTER';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <nav style={{
          backgroundColor: '#1976D2',
          padding: '15px 30px',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>🗳️ Secure Election System</h1>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {!isAdmin && !isVoter && (
                <>
                  <Link to="/voter/register" style={{ color: 'white', textDecoration: 'none' }}>
                    Register
                  </Link>
                  <Link to="/voter/login" style={{ color: 'white', textDecoration: 'none' }}>
                    Voter Login
                  </Link>
                  <Link to="/admin/login" style={{ color: 'white', textDecoration: 'none' }}>
                    Admin Login
                  </Link>
                </>
              )}

              {isVoter && (
                <>
                  <Link to="/voter/voting" style={{ color: 'white', textDecoration: 'none' }}>
                    🗳️ Cast Vote
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid white',
                      padding: '8px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Logout
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                    📊 Dashboard
                  </Link>
                  <Link to="/admin/manage" style={{ color: 'white', textDecoration: 'none' }}>
                    ⚙️ Manage
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid white',
                      padding: '8px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <h1>Welcome to Secure Election System</h1>
              <p style={{ fontSize: '18px', marginTop: '20px' }}>
                A secure, transparent, and efficient voting platform with facial recognition
              </p>
              <div style={{ marginTop: '40px' }}>
                <Link to="/voter/register">
                  <button style={{
                    padding: '15px 40px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '15px'
                  }}>
                    Register to Vote
                  </button>
                </Link>
                <Link to="/voter/login">
                  <button style={{
                    padding: '15px 40px',
                    fontSize: '16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '15px'
                  }}>
                    Cast Your Vote
                  </button>
                </Link>
                <Link to="/admin/login">
                  <button style={{
                    padding: '15px 40px',
                    fontSize: '16px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}>
                    Admin Portal
                  </button>
                </Link>
              </div>
            </div>
          } />

          {/* ✅ Routes */}
          <Route path="/voter/register" element={<VoterRegistration />} />
          <Route path="/voter/login" element={<VoterLogin />} />
          <Route path="/voter/voting" element={<VotingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage" element={<ElectionManagement />} />
          <Route path="/verify" element={<VoteVerification />} />
        </Routes>

        <footer style={{
          backgroundColor: '#333',
          color: 'white',
          textAlign: 'center',
          padding: '20px',
          marginTop: '50px'
        }}>
          <p>©Secure Election System | Built with React, FastAPI, MySQL</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Features: Face Recognition (MTCNN + FaceNet) | End-to-End Encryption | Comprehensive Audit Logs
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;