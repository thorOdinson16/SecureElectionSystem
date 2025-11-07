import React, { useState } from 'react';
import FaceCapture from './FaceCapture';
import { voterAPI } from '../services/api';

const VoterRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'M',
    address: '',
    constituency_id: 1,
    voter_id_number: '',
    password: '',
    confirmPassword: ''
  });
  const [faceImage, setFaceImage] = useState(null);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFaceCapture = (imageData) => {
    setFaceImage(imageData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!faceImage) {
      setError('Please capture your face image');
      return;
    }

    try {
      const response = await voterAPI.register(formData, faceImage);
      setMessage('Registration successful! You can now login.');
      setTimeout(() => {
        window.location.href = '/voter/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Voter Registration</h2>
      
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div style={{ marginBottom: '15px' }}>
            <label>Full Name:</label><br />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Date of Birth:</label><br />
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Gender:</label><br />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Address:</label><br />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Constituency ID:</label><br />
            <input
              type="number"
              name="constituency_id"
              value={formData.constituency_id}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Voter ID Number:</label><br />
            <input
              type="text"
              name="voter_id_number"
              value={formData.voter_id_number}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Password:</label><br />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Confirm Password:</label><br />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
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
            Next: Face Registration
          </button>
        </form>
      )}

      {step === 2 && (
        <div>
          <FaceCapture onCapture={handleFaceCapture} mode="register" />
          <button
            onClick={handleSubmit}
            disabled={!faceImage}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: faceImage ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: faceImage ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              marginTop: '20px'
            }}
          >
            Complete Registration
          </button>
          <button
            onClick={() => setStep(1)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            Back
          </button>
        </div>
      )}

      {message && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px' }}>{message}</div>}
      {error && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>{error}</div>}
    </div>
  );
};

export default VoterRegistration;