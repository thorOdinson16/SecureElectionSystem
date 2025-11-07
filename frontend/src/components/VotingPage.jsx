import React, { useState, useEffect } from 'react';
import FaceCapture from './FaceCapture';
import { voterAPI, electionAPI } from '../services/api';

const VotingPage = () => {
  const [step, setStep] = useState(1);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voterProfile, setVoterProfile] = useState(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteVerificationData, setVoteVerificationData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedElection) return;

    const hasVoted = localStorage.getItem(`voted_${selectedElection.electionId}`);
    if (hasVoted === 'true') {
      setStep(5);
      setMessage('You have already voted in this election. Each voter gets one vote per election.');
      setVoteVerificationData(null); // Optional: clear old receipt
    }
  }, [selectedElection]);
  
  const loadData = async () => {
    try {
      const [electionsRes, profileRes] = await Promise.all([
        electionAPI.getActive(),
        voterAPI.getProfile()
      ]);
      
      setElections(electionsRes.data);
      setVoterProfile(profileRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleFaceVerification = async (faceImage) => {
    setLoading(true);
    setError('');
    
    try {
      const voterId = localStorage.getItem('voter_id');
      const response = await voterAPI.verifyFace(voterId, faceImage);
      
      if (response.data.verified) {
        setFaceVerified(true);
        setMessage(`Face verified! Similarity: ${(response.data.similarity * 100).toFixed(2)}%`);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Face verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSelect = async (election) => {
    setSelectedElection(election);
    setLoading(true);
    
    try {
      const response = await electionAPI.getCandidates(
        election.electionId,
        voterProfile.constituencyId
      );
      setCandidates(response.data);
      setStep(3);
    } catch (err) {
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setStep(4);
  };

  const handleVoteConfirm = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await voterAPI.castVote({
        election_id: selectedElection.electionId,
        candidate_id: selectedCandidate.candidateId
      });
      
      setMessage('Vote cast successfully! Vote Hash: ' + response.data.vote_hash);
      localStorage.setItem(`voted_${response.data.election_id}`, 'true');
      setStep(5);

      setVoteVerificationData({
        vote_id: response.data.vote_id,
        vote_hash: response.data.vote_hash
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cast vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h2>Secure Voting System</h2>

      {step === 1 && (
        <div>
          <h3>Step 1: Face Verification</h3>
          <p>Please verify your identity using facial recognition</p>
          <FaceCapture onCapture={handleFaceVerification} mode="verify" />
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 2: Select Election</h3>
          <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
            {elections.map(election => (
              <div
                key={election.electionId}
                onClick={() => handleElectionSelect(election)}
                style={{
                  padding: '20px',
                  border: '2px solid #2196F3',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <h4>{election.title}</h4>
                <p>Start: {new Date(election.startTime).toLocaleString()}</p>
                <p>End: {new Date(election.endTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Step 3: Select Candidate</h3>
          <p>Constituency: {voterProfile?.constituency_name}</p>
          <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
            {candidates.map(candidate => (
              <div
                key={candidate.candidateId}
                onClick={() => handleCandidateSelect(candidate)}
                style={{
                  padding: '20px',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e8f5e9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div>
                  <h4>{candidate.name}</h4>
                  <p><strong>Party:</strong> {candidate.partyName}</p>
                  <p><strong>Age:</strong> {candidate.age}</p>
                  <p><strong>Party Leader:</strong> {candidate.leader}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Step 4: Confirm Your Vote</h3>
          <div style={{
            padding: '30px',
            border: '3px solid #ff9800',
            borderRadius: '8px',
            backgroundColor: '#fff3e0',
            marginTop: '20px'
          }}>
            <h4>You are voting for:</h4>
            <h2>{selectedCandidate.name}</h2>
            <p><strong>Party:</strong> {selectedCandidate.partyName}</p>
            <p style={{ color: '#d32f2f', marginTop: '20px' }}>
              ⚠️ This action cannot be undone!
            </p>
          </div>
          <div style={{ marginTop: '30px' }}>
            <button
              onClick={handleVoteConfirm}
              disabled={loading}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '15px'
              }}
            >
              {loading ? 'Casting Vote...' : 'Confirm Vote'}
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            padding: '30px',
            border: '3px solid #4CAF50',
            borderRadius: '8px',
            backgroundColor: '#e8f5e9'
          }}>
            <h2 style={{ color: '#2e7d32' }}>Vote Successfully Cast!</h2>
            <p style={{ fontSize: '16px', marginTop: '20px' }}>
              Thank you for participating in the democratic process.
            </p>
            {voteVerificationData && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8f0', borderRadius: '8px' }}>
                <p><strong>Vote ID:</strong> {voteVerificationData.vote_id}</p>
                <p><strong>Vote Hash:</strong> {voteVerificationData.vote_hash}</p>
                <a 
                  href={`/verify?vote=${voteVerificationData.vote_id}&hash=${voteVerificationData.vote_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  Verify Your Vote Receipt
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}

      {message && step !== 5 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default VotingPage;