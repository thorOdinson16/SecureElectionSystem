import React, { useState } from 'react';
import { voterAPI } from '../services/api';

const VoterLogin = () => {
  const [credentials, setCredentials] = useState({
    voter_id_number: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await voterAPI.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('voter_id', response.data.voter_id);
      localStorage.setItem('has_voted', response.data.has_voted);
      window.location.href = '/voter/voting';
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Voter Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>Voter ID Number:</label><br />
          <input
            type="text"
            name="voter_id_number"
            value={credentials.voter_id_number}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Password:</label><br />
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '14px' }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Login
        </button>
      </form>

      {error && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', textAlign: 'center' }}>{error}</div>}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a href="/voter/register" style={{ color: '#2196F3', textDecoration: 'none' }}>
          Don't have an account? Register here
        </a>
      </div>
    </div>
  );
};

export default VoterLogin;