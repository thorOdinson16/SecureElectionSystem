import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultsDisplay = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'chart', 'summary'

  // Colors for pie chart
  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      // In production, you'd have an endpoint to get all elections
      // For now, using static data
      setElections([
        { electionId: 1, title: 'General Election 2024', startTime: '2024-11-01 08:00:00', endTime: '2024-11-01 18:00:00' }
      ]);
    } catch (err) {
      setError('Failed to load elections');
    }
  };

  const loadResults = async (electionId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await adminAPI.getResults(electionId);
      setResults(response.data);
      
      // Extract unique constituencies
      const uniqueConstituencies = [...new Set(response.data.map(r => r.constituency))];
      setConstituencies(uniqueConstituencies);
      
      if (uniqueConstituencies.length > 0) {
        setSelectedConstituency(uniqueConstituencies[0]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSelect = (election) => {
    setSelectedElection(election);
    loadResults(election.electionId);
  };

  // Filter results by selected constituency
  const filteredResults = selectedConstituency
    ? results.filter(r => r.constituency === selectedConstituency)
    : results;

  // Prepare data for charts
  const chartData = filteredResults.map(result => ({
    name: result.candidate_name,
    votes: result.totalVotes,
    percentage: result.votePercentage,
    party: result.partyName
  }));

  // Calculate summary statistics
  const totalVotes = filteredResults.reduce((sum, r) => sum + r.totalVotes, 0);
  const winner = filteredResults.find(r => r.rank_position === 1);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Election Results</h1>

      {/* Election Selection */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Select Election</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {elections.map(election => (
            <div
              key={election.electionId}
              onClick={() => handleElectionSelect(election)}
              style={{
                padding: '20px',
                border: selectedElection?.electionId === election.electionId ? '3px solid #2196F3' : '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedElection?.electionId === election.electionId ? '#e3f2fd' : 'white',
                transition: 'all 0.3s'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0' }}>
                {selectedElection?.electionId === election.electionId && '✓ '}
                {election.title}
              </h4>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                ID: {election.electionId}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Start: {new Date(election.startTime).toLocaleString()}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                End: {new Date(election.endTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Constituency Selection */}
      {constituencies.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Select Constituency</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {constituencies.map(constituency => (
              <button
                key={constituency}
                onClick={() => setSelectedConstituency(constituency)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedConstituency === constituency ? '#2196F3' : 'white',
                  color: selectedConstituency === constituency ? 'white' : '#333',
                  border: '2px solid #2196F3',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedConstituency === constituency ? 'bold' : 'normal'
                }}
              >
                {constituency}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      {results.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setViewMode('summary')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'summary' ? '#4CAF50' : 'white',
              color: viewMode === 'summary' ? 'white' : '#333',
              border: '2px solid #4CAF50',
              borderRadius: '5px 0 0 5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'table' ? '#4CAF50' : 'white',
              color: viewMode === 'table' ? 'white' : '#333',
              border: '2px solid #4CAF50',
              borderLeft: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'chart' ? '#4CAF50' : 'white',
              color: viewMode === 'chart' ? 'white' : '#333',
              border: '2px solid #4CAF50',
              borderLeft: 'none',
              borderRadius: '0 5px 5px 0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Chart View
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading results...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && filteredResults.length > 0 && winner && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Winner Card */}
            <div style={{
              padding: '30px',
              backgroundColor: '#e8f5e9',
              border: '3px solid #4CAF50',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
              <h3 style={{ margin: '10px 0', color: '#2e7d32' }}>Winner</h3>
              <h2 style={{ margin: '10px 0', fontSize: '24px' }}>{winner.candidate_name}</h2>
              <p style={{ fontSize: '16px', color: '#666' }}>{winner.partyName}</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32', marginTop: '10px' }}>
                {winner.totalVotes.toLocaleString()} votes
              </p>
              <p style={{ fontSize: '16px', color: '#666' }}>
                {winner.votePercentage}% of total votes
              </p>
            </div>

            {/* Total Votes Card */}
            <div style={{
              padding: '30px',
              backgroundColor: '#e3f2fd',
              border: '3px solid #2196F3',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
              <h3 style={{ margin: '10px 0', color: '#1565c0' }}>Total Votes Cast</h3>
              <h2 style={{ margin: '10px 0', fontSize: '32px', color: '#1565c0' }}>
                {totalVotes.toLocaleString()}
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
                Across {filteredResults.length} candidates
              </p>
            </div>

            {/* Victory Margin Card */}
            <div style={{
              padding: '30px',
              backgroundColor: '#fff3e0',
              border: '3px solid #FF9800',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📈</div>
              <h3 style={{ margin: '10px 0', color: '#e65100' }}>Victory Margin</h3>
              <h2 style={{ margin: '10px 0', fontSize: '32px', color: '#e65100' }}>
                {winner.victory_margin?.toLocaleString() || 'N/A'}
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
                votes ahead of runner-up
              </p>
            </div>

            {/* Constituency Info Card */}
            <div style={{
              padding: '30px',
              backgroundColor: '#f3e5f5',
              border: '3px solid #9C27B0',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📍</div>
              <h3 style={{ margin: '10px 0', color: '#6a1b9a' }}>Constituency</h3>
              <h2 style={{ margin: '10px 0', fontSize: '24px', color: '#6a1b9a' }}>
                {selectedConstituency}
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
                {selectedElection?.title}
              </p>
            </div>
          </div>

          {/* Top 3 Candidates */}
          <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Top 3 Candidates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {filteredResults.slice(0, 3).map((result, index) => (
              <div
                key={result.candidateId}
                style={{
                  padding: '20px',
                  backgroundColor: index === 0 ? '#fff9c4' : index === 1 ? '#e0e0e0' : '#d7ccc8',
                  border: `3px solid ${index === 0 ? '#F9A825' : index === 1 ? '#9E9E9E' : '#795548'}`,
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {result.candidate_name}
                    </h2>
                    <p style={{ margin: '5px 0', color: '#666' }}>{result.partyName}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '24px' }}>{result.totalVotes.toLocaleString()}</h3>
                    <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>{result.votePercentage}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredResults.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd' }}>Rank</th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd' }}>Candidate</th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd' }}>Party</th>
                <th style={{ padding: '15px', textAlign: 'right', border: '1px solid #ddd' }}>Votes</th>
                <th style={{ padding: '15px', textAlign: 'right', border: '1px solid #ddd' }}>Percentage</th>
                <th style={{ padding: '15px', textAlign: 'right', border: '1px solid #ddd' }}>Victory Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr 
                  key={result.candidateId}
                  style={{ 
                    backgroundColor: result.rank_position === 1 ? '#e8f5e9' : index % 2 === 0 ? '#f9f9f9' : 'white'
                  }}
                >
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd',
                    fontWeight: result.rank_position === 1 ? 'bold' : 'normal'
                  }}>
                    {result.rank_position === 1 ? '🏆' : result.rank_position}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid #ddd',
                    fontWeight: result.rank_position === 1 ? 'bold' : 'normal'
                  }}>
                    {result.candidate_name}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {result.partyName}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    border: '1px solid #ddd',
                    fontWeight: result.rank_position === 1 ? 'bold' : 'normal',
                    color: result.rank_position === 1 ? '#2e7d32' : 'inherit'
                  }}>
                    {result.totalVotes.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    border: '1px solid #ddd',
                    fontWeight: result.rank_position === 1 ? 'bold' : 'normal'
                  }}>
                    {result.votePercentage}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    border: '1px solid #ddd',
                    color: result.rank_position === 1 ? '#2e7d32' : '#666'
                  }}>
                    {result.victory_margin ? result.victory_margin.toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && chartData.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Bar Chart */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Votes by Candidate</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votes" fill="#2196F3" name="Total Votes" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Vote Share Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Party-wise Summary */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '30px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Party-wise Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {chartData.map((data, index) => (
                <div
                  key={index}
                  style={{
                    padding: '15px',
                    backgroundColor: COLORS[index % COLORS.length] + '20',
                    border: `2px solid ${COLORS[index % COLORS.length]}`,
                    borderRadius: '8px'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0', color: COLORS[index % COLORS.length] }}>
                    {data.party}
                  </h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>{data.name}</strong>
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    {data.votes.toLocaleString()} votes
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {data.percentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && selectedElection && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No Results Available</h3>
          <p style={{ color: '#999' }}>Results will be displayed here once votes are counted</p>
        </div>
      )}

      {/* No Election Selected */}
      {!selectedElection && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗳️</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>Select an Election</h3>
          <p style={{ color: '#999' }}>Choose an election from above to view its results</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;