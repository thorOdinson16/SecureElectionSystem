import React, { useState, useEffect } from 'react';
import { adminAPI, generalAPI } from '../services/api';

const ElectionManagement = () => {
  const [activeTab, setActiveTab] = useState('create-election');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Election Form
  const [electionForm, setElectionForm] = useState({
    title: '',
    start_time: '',
    end_time: ''
  });

  // Candidate Form
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    age: '',
    party_id: '',
    election_id: '',
    constituency_id: '',
    criminal_records: ''
  });

  const [parties, setParties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [elections, setElections] = useState([]);

  useEffect(() => {
    loadStaticData();
  }, []);


  const loadStaticData = async () => {
    setLoading(true);
    try {
      const [partyRes, constituencyRes, electionRes] = await Promise.all([
        generalAPI.getParties(),
        generalAPI.getConstituencies(),
        generalAPI.getElections()
      ]);

      setParties(partyRes.data);
      setConstituencies(constituencyRes.data);
      setElections(electionRes.data);
    } catch (err) {
      console.error('Error fetching data:', err.response ? err.response.data : err);
      setError('Failed to load data. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Format datetime for backend
      const formattedData = {
        title: electionForm.title,
        start_time: new Date(electionForm.start_time).toISOString(),
        end_time: new Date(electionForm.end_time).toISOString()
      };

      const response = await adminAPI.createElection(formattedData);
      setMessage(`✅ Election created successfully! Election ID: ${response.data.election_id}`);
      setElectionForm({ title: '', start_time: '', end_time: '' });
      
      // Refresh elections list
      setElections([...elections, { 
        electionId: response.data.election_id, 
        title: formattedData.title 
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create election');
      console.error('Election creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const formattedData = {
        name: candidateForm.name,
        age: parseInt(candidateForm.age),
        party_id: parseInt(candidateForm.party_id),
        election_id: parseInt(candidateForm.election_id),
        constituency_id: parseInt(candidateForm.constituency_id),
        criminal_records: candidateForm.criminal_records || null
      };

      const response = await adminAPI.addCandidate(formattedData);
      setMessage(`✅ Candidate added successfully! Candidate ID: ${response.data.candidate_id}`);
      setCandidateForm({
        name: '',
        age: '',
        party_id: '',
        election_id: '',
        constituency_id: '',
        criminal_records: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add candidate');
      console.error('Candidate addition error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>⚙️ Election Management</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>Create elections and add candidates to the system</p>

      <div style={{ marginBottom: '30px', borderBottom: '2px solid #ddd', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => { setActiveTab('create-election'); setMessage(''); setError(''); }}
          style={{
            padding: '12px 30px',
            backgroundColor: activeTab === 'create-election' ? '#2196F3' : 'transparent',
            color: activeTab === 'create-election' ? 'white' : '#333',
            border: 'none',
            borderBottom: activeTab === 'create-election' ? '3px solid #2196F3' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'create-election' ? 'bold' : 'normal',
            transition: 'all 0.3s'
          }}
        >
          📅 Create Election
        </button>
        <button
          onClick={() => { setActiveTab('add-candidate'); setMessage(''); setError(''); }}
          style={{
            padding: '12px 30px',
            backgroundColor: activeTab === 'add-candidate' ? '#2196F3' : 'transparent',
            color: activeTab === 'add-candidate' ? 'white' : '#333',
            border: 'none',
            borderBottom: activeTab === 'add-candidate' ? '3px solid #2196F3' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'add-candidate' ? 'bold' : 'normal',
            transition: 'all 0.3s'
          }}
        >
          👤 Add Candidate
        </button>
      </div>

      {activeTab === 'create-election' && (
        <div style={{ 
          padding: '40px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '25px', color: '#1976D2' }}>📋 Create New Election</h3>
          <form onSubmit={handleElectionSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Election Title: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={electionForm.title}
                onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                required
                placeholder="e.g., General Election 2024, State Assembly Election"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Start Date & Time: <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={electionForm.start_time}
                  onChange={(e) => setElectionForm({ ...electionForm, start_time: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  End Date & Time: <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={electionForm.end_time}
                  onChange={(e) => setElectionForm({ ...electionForm, end_time: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '5px',
              marginBottom: '25px',
              border: '1px solid #ffc107'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                ℹ️ <strong>Note:</strong> RSA encryption keys will be automatically generated for this election.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
            >
              {loading ? '⏳ Creating Election...' : '✅ Create Election'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'add-candidate' && (
        <div style={{ 
          padding: '40px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '25px', color: '#1976D2' }}>👤 Add New Candidate</h3>
          <form onSubmit={handleCandidateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Candidate Name: <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  required
                  placeholder="Full name of candidate"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Age: <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  value={candidateForm.age}
                  onChange={(e) => setCandidateForm({ ...candidateForm, age: e.target.value })}
                  required
                  min="25"
                  placeholder="Must be 25 or older"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Political Party: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={candidateForm.party_id}
                  onChange={(e) => setCandidateForm({ ...candidateForm, party_id: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Select Party --</option>
                  {parties.map(party => (
                    <option key={party.partyId} value={party.partyId}>
                      {party.partyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Election: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={candidateForm.election_id}
                  onChange={(e) => setCandidateForm({ ...candidateForm, election_id: e.target.value })}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Select Election --</option>
                  {elections.map(election => (
                    <option key={election.electionId} value={election.electionId}>
                      {election.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Constituency: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={candidateForm.constituency_id}
                onChange={(e) => setCandidateForm({ ...candidateForm, constituency_id: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Select Constituency --</option>
                {constituencies.map(constituency => (
                  <option key={constituency.constituencyId} value={constituency.constituencyId}>
                    {constituency.name} ({constituency.state})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Criminal Records (Optional):
              </label>
              <textarea
                value={candidateForm.criminal_records}
                onChange={(e) => setCandidateForm({ ...candidateForm, criminal_records: e.target.value })}
                placeholder="Enter any criminal records or leave empty if none"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '100px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
            >
              {loading ? '⏳ Adding Candidate...' : '✅ Add Candidate'}
            </button>
          </form>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '25px',
          padding: '15px 20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px',
          textAlign: 'center',
          border: '1px solid #c3e6cb',
          fontSize: '15px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '25px',
          padding: '15px 20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          textAlign: 'center',
          border: '1px solid #f5c6cb',
          fontSize: '15px'
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default ElectionManagement;