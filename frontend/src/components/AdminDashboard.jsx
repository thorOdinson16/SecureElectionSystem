import React, { useState, useEffect } from 'react';
import { adminAPI, generalAPI, publicAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('results');
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState([]);
  const [votingPatterns, setVotingPatterns] = useState([]);
  const [demographics, setDemographics] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authVoterId, setAuthVoterId] = useState('');
  const [authRate, setAuthRate] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [turnout, setTurnout] = useState(null);
  const [turnoutLoading, setTurnoutLoading] = useState(false);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    setLoading(true);
    try {
      const response = await generalAPI.getElections(); // ✅ Now fetches from backend
      setElections(response.data);
      
      // Auto-select first election if available
      if (response.data.length > 0) {
        setSelectedElection(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (electionId) => {
    setLoading(true);
    try {
      const response = await adminAPI.getResults(electionId);
      setResults(response.data);
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVotingPatterns = async (electionId) => {
    setLoading(true);
    try {
      const response = await adminAPI.getVotingPatterns(electionId);
      setVotingPatterns(response.data);
    } catch (err) {
      console.error('Error loading patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDemographics = async (electionId, constituencyId) => {
    setLoading(true);
    try {
      const response = await adminAPI.getDemographics(electionId, constituencyId);
      setDemographics(response.data);
    } catch (err) {
      console.error('Error loading demographics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurity = async () => {
    setLoading(true);
    try {
      const [suspicious, logs] = await Promise.all([
        adminAPI.getSuspiciousActivities(),
        adminAPI.getAuditLogs(100)
      ]);
      setSuspiciousActivities(suspicious.data);
      setAuditLogs(logs.data);
    } catch (err) {
      console.error('Error loading security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTurnout = async (constituencyId, electionId) => {
    if (!constituencyId || !electionId) return;
    setTurnoutLoading(true);
    try {
      const res = await publicAPI.getTurnout(constituencyId, electionId);
      setTurnout(res.data.turnout_percentage);
    } catch (err) {
      console.error('Turnout error:', err);
    } finally {
      setTurnoutLoading(false);
    }
  };

  const checkAuthRate = async () => {
    if (!authVoterId) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthRate(null);
    try {
      const res = await adminAPI.getAuthSuccessRate(authVoterId);
      setAuthRate(res.data.success_rate);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Voter not found');
    } finally {
      setAuthLoading(false);
    }
  };

  const allAgeGroups = ['<25', '26-35', '36-50', '>50'];
              const filledDemographics = allAgeGroups.map(group => {
                const match = demographics.find(d => d.ageGroup === group);
                return match || { ageGroup: group, gender: '-', totalVoters: 0, votedCount: 0, turnoutPercentage: 0 };
              });
    
  const calculateResults = async (electionId, constituencyId) => {
    if (!electionId || !constituencyId) {
      alert('⚠️ Please select both an election and constituency');
      return;
    }

    if (!confirm(`🧮 Calculate results for:\n\nElection: ${selectedElection?.title}\nConstituency ID: ${constituencyId}\n\nThis will process all votes and publish results. Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.calculateResults(electionId, constituencyId);
      alert(res.data?.message || '✅ Results calculated successfully!');
      
      // Reload results to show updated data
      await loadResults(electionId);
    } catch (err) {
      console.error('Error calculating results:', err);
      alert('❌ Error calculating results: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('results')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'results' ? '#2196F3' : 'transparent',
            color: activeTab === 'results' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Results
        </button>
        <button
          onClick={() => { setActiveTab('analytics'); loadVotingPatterns(1); }}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'analytics' ? '#2196F3' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Analytics
        </button>
        <button
          onClick={() => { setActiveTab('security'); loadSecurity(); }}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'security' ? '#2196F3' : 'transparent',
            color: activeTab === 'security' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Security
        </button>
      </div>

      {activeTab === 'results' && (
        <div>
          <h2>Election Results</h2>
          
          {/* Election Selection Dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select Election:</label>
            <select
              value={selectedElection?.electionId || ''}
              onChange={(e) => {
                const election = elections.find(el => el.electionId === parseInt(e.target.value));
                setSelectedElection(election);
                if (election) {
                  loadResults(election.electionId);
                }
              }}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '2px solid #2196F3',
                marginRight: '10px'
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

          {/* Action Buttons */}
          {selectedElection && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => loadResults(selectedElection.electionId)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Results
              </button>
              
              <button
                onClick={async () => {
                  if (!confirm(`🧮 Calculate results for ALL constituencies in:\n\n${selectedElection.title}\n\nThis will process all votes. Continue?`)) return;
                  
                  setLoading(true);
                  try {
                    const res = await adminAPI.calculateAllResults(selectedElection.electionId);
                    alert(`✅ ${res.data.message}`);
                    await loadResults(selectedElection.electionId);
                  } catch (err) {
                    alert('❌ Error: ' + (err.response?.data?.detail || 'Failed to calculate'));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Calculating...' : '🧮 Calculate All Results'}
              </button>
              
              <span style={{ color: '#666', fontSize: '14px' }}>
                Election: <strong>{selectedElection.title}</strong> (ID: {selectedElection.electionId})
              </span>
            </div>
          )}

          {/* Results Table */}
          {loading ? (
            <p>Loading...</p>
          ) : results.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Constituency</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Candidate</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Party</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>Votes</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>Percentage</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>Margin</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} style={{ backgroundColor: result.rank_position === 1 ? '#e8f5e9' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{result.constituency}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{result.candidate_name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{result.partyName}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{result.totalVotes}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{result.votePercentage}%</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{result.victory_margin}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {result.rank_position === 1 ? '🏆' : result.rank_position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px' 
            }}>
              <p style={{ fontSize: '18px', color: '#666' }}>
                {selectedElection 
                  ? '📊 No results available. Click "Calculate Results" to generate them.' 
                  : '⬆️ Please select an election first'}
              </p>
            </div>
          )}
          {selectedElection && results.length > 0 && (
            <div
              style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#f0f8ff',
                borderRadius: 8,
              }}
            >
              <button
                onClick={() => {
                  const constituencyId = results[0]?.constituencyId;
                  const electionId = selectedElection?.electionId;
                  console.log("Selected Election:", selectedElection);
                  console.log("Calling loadTurnout with:", constituencyId, electionId);
                  
                  if (constituencyId && electionId) {
                    loadTurnout(constituencyId, electionId); // ✅ pass both
                  } else {
                    console.warn('Missing constituencyId or electionId');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                }}
              >
                Load Turnout for {results[0]?.constituency}
              </button>

              {turnoutLoading && <span style={{ marginLeft: 10 }}>Loading...</span>}
              {turnout !== null && !turnoutLoading && (
                <span
                  style={{
                    marginLeft: 15,
                    fontWeight: 'bold',
                    color: '#1565c0',
                  }}
                >
                  Current Turnout: {turnout}%
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h2>Voting Analytics</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                const electionId = selectedElection?.electionId || 1;
                const constituencyId = results[0]?.constituencyId || 1;
                loadDemographics(electionId, constituencyId);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Load Demographics
            </button>
          </div>

          {votingPatterns.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3>Hourly Voting Patterns</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={votingPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="voting_hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Votes Cast', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="votes_cast" stroke="#2196F3" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {demographics.length > 0 && (
            <div>
              <h3>Demographic Statistics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filledDemographics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" label={{ value: 'Age Group', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Turnout %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="turnoutPercentage" fill="#4CAF50" name="Turnout %" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Age Group</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Gender</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Total Voters</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Voted</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Turnout %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demographics.map((demo, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{demo.ageGroup}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{demo.gender}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{demo.totalVoters}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{demo.votedCount}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{demo.turnoutPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div>
          <h2>Security Monitoring</h2>
          
          <div style={{ marginBottom: '40px' }}>
            <h3>Suspicious Activities (Last 24 Hours)</h3>
            {suspiciousActivities.length === 0 ? (
              <p style={{ color: '#4CAF50' }}>✓ No suspicious activities detected</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffebee' }}>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Voter ID</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Name</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Failed Attempts</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Different IPs</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>IP Addresses</th>
                      <th style={{ padding: '12px', border: '1px solid #ddd' }}>Time Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspiciousActivities.map((activity, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{activity.voterIdNumber}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{activity.name}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', color: '#d32f2f', fontWeight: 'bold' }}>
                          {activity.failed_attempts}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{activity.different_ips}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px' }}>
                          {activity.ip_addresses}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px' }}>
                          {new Date(activity.first_attempt).toLocaleString()} - {new Date(activity.last_attempt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3>Recent Audit Logs</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Voter ID</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Success Logins</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Failed Logins</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Face Auth ✓</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Face Auth ✗</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd' }}>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{log.voterIdNumber}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{log.name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#4CAF50' }}>
                        {log.successful_logins}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#d32f2f' }}>
                        {log.failed_logins}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#4CAF50' }}>
                        {log.face_auth_success}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#d32f2f' }}>
                        {log.face_auth_failed}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {new Date(log.last_attempt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: '40px' }}>
            <h3>Check Voter Auth Success Rate</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                placeholder="Enter Voter ID"
                value={authVoterId}
                onChange={(e) => setAuthVoterId(e.target.value)}
                style={{ padding: 10, width: 180, border: '1px solid #ccc', borderRadius: 6 }}
              />
              <button
                onClick={checkAuthRate}
                disabled={authLoading || !authVoterId}
                style={{
                  padding: '10px 20px',
                  backgroundColor: authLoading ? '#ccc' : '#1a3e72',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: authLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {authLoading ? 'Checking...' : 'Check'}
              </button>
            </div>

            {authError && <p style={{ color: 'red', marginTop: 10 }}>{authError}</p>}
            {authRate !== null && (
              <div style={{
                marginTop: 15,
                padding: 15,
                backgroundColor: '#e3f2fd',
                borderRadius: 8,
                fontWeight: 'bold',
                color: '#1565c0'
              }}>
                Auth Success Rate: {authRate.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;