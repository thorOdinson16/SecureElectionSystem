import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const voterAPI = {
  register: (voterData, faceImage) => 
    api.post('/voter/register', { voter: voterData, face_image: faceImage }),

  login: (credentials) => 
    api.post('/voter/login', credentials),
  
  verifyFace: (voterId, faceImage) => 
    api.post('/voter/verify-face', { voter_id: voterId, face_image: faceImage }),
  
  castVote: (voteData) => 
    api.post('/voter/cast-vote', voteData),
  
  getProfile: () => 
    api.get('/voter/profile')
};

export const electionAPI = {
  getActive: () => 
    api.get('/elections/active'),
  
  getCandidates: (electionId, constituencyId) => 
    api.get(`/elections/${electionId}/candidates`, { params: { constituency_id: constituencyId } })
};

export const generalAPI = {
  getParties: () => 
    api.get('/parties'),

  getConstituencies: () => 
    api.get('/constituencies'),

  getElections: () => 
    api.get('/elections')
};

export const publicAPI = {
  getTurnout: (constituencyId, electionId) =>
    api.get(`/constituency/${constituencyId}/turnout/${electionId}`),
  getTotalVotes: (id) => 
    api.get(`/election/${id}/total-votes`),
  verifyVoteHash: (voteId, hash) => 
    api.get(`/vote/verify/${voteId}`, { params: { hash } })
};

export const adminAPI = {
  login: (credentials) => 
    api.post('/admin/login', credentials),
  
  getAuthSuccessRate: (voterId) => 
    api.get(`/voter/${voterId}/auth-success-rate`),

  decryptVote: (voteId) => 
    api.post(`/admin/vote/decrypt/${voteId}`),

  createElection: (electionData) => 
    api.post('/admin/elections', electionData),
  
  addCandidate: (candidateData) => 
    api.post('/admin/candidates', candidateData),
  
  calculateResults: (electionId, constituencyId) => 
    api.post(`/admin/results/calculate/${electionId}/${constituencyId}`),
  
  calculateAllResults: (electionId) => 
    api.post(`/admin/results/calculate-all/${electionId}`),
  
  getResults: (electionId) => 
    api.get(`/admin/results/${electionId}`),
  
  getVotingPatterns: (electionId) => 
    api.get('/admin/analytics/voting-patterns', { params: { election_id: electionId } }),
  
  getDemographics: (electionId, constituencyId) => 
    api.get(`/admin/analytics/demographics/${electionId}/${constituencyId}`),
  
  getSuspiciousActivities: () => 
    api.get('/admin/security/suspicious-activities'),
  
  getAuditLogs: (limit = 100) => 
    api.get('/admin/audit-logs', { params: { limit } })
};

export default api;