-- Query 1: Comprehensive election results with demographics
SELECT 
    e.title as election_name,
    co.name as constituency,
    c.name as candidate_name,
    p.partyName,
    r.totalVotes,
    r.votePercentage,
    CalculateVictoryMargin(e.electionId, co.constituencyId) as victory_margin,
    CalculateTurnout(co.constituencyId) as turnout_percentage,
    RANK() OVER (PARTITION BY e.electionId, co.constituencyId ORDER BY r.totalVotes DESC) as rank_position
FROM ELECTION e
JOIN RESULT r ON e.electionId = r.electionId
JOIN CANDIDATE c ON r.candidateId = c.candidateId
JOIN PARTY p ON c.partyId = p.partyId
JOIN CONSTITUENCY co ON r.constituencyId = co.constituencyId
ORDER BY e.electionId, co.constituencyId, r.totalVotes DESC;

-- Query 2: Audit log analysis - Authentication patterns
SELECT 
    v.voterIdNumber,
    v.name,
    COUNT(CASE WHEN al.actionType = 'LOGIN' AND al.actionStatus = 'SUCCESS' THEN 1 END) as successful_logins,
    COUNT(CASE WHEN al.actionType = 'LOGIN' AND al.actionStatus = 'FAILED' THEN 1 END) as failed_logins,
    COUNT(CASE WHEN al.actionType = 'FACE_AUTH' AND al.actionStatus = 'SUCCESS' THEN 1 END) as face_auth_success,
    COUNT(CASE WHEN al.actionType = 'FACE_AUTH' AND al.actionStatus = 'FAILED' THEN 1 END) as face_auth_failed,
    GetAuthSuccessRate(v.voterId) as overall_success_rate,
    MIN(al.timestamp) as first_attempt,
    MAX(al.timestamp) as last_attempt,
    COUNT(DISTINCT al.ipAddress) as unique_ips
FROM VOTER v
LEFT JOIN AUDIT_LOG al ON v.voterId = al.userId AND al.userType = 'VOTER'
GROUP BY v.voterId, v.voterIdNumber, v.name
HAVING COUNT(al.logId) > 0
ORDER BY failed_logins DESC;

-- Query 3: Hourly voting pattern analysis
SELECT 
    e.title,
    DATE(v.timestamp) as voting_date,
    HOUR(v.timestamp) as voting_hour,
    COUNT(*) as votes_cast,
    COUNT(DISTINCT v.voterId) as unique_voters,
    COUNT(DISTINCT c.constituencyId) as constituencies,
    ROUND(AVG(TIMESTAMPDIFF(SECOND, 
        (SELECT timestamp FROM AUDIT_LOG 
         WHERE userId = v.voterId AND actionType = 'LOGIN' 
         AND timestamp < v.timestamp 
         ORDER BY timestamp DESC LIMIT 1), 
        v.timestamp)), 0) as avg_voting_duration_seconds
FROM VOTE v
JOIN ELECTION e ON v.electionId = e.electionId
JOIN CANDIDATE c ON v.candidateId = c.candidateId
GROUP BY e.electionId, e.title, DATE(v.timestamp), HOUR(v.timestamp)
ORDER BY voting_date, voting_hour;

-- Query 4: Constituency-wise demographic voting analysis
SELECT 
    co.name as constituency,
    ds.ageGroup,
    ds.gender,
    ds.totalVoters,
    ds.votedCount,
    ds.turnoutPercentage,
    ROUND((ds.votedCount * 100.0) / (
        SELECT SUM(votedCount) 
        FROM DEMOGRAPHIC_STATS 
        WHERE constituencyId = co.constituencyId
    ), 2) as percentage_of_total_votes
FROM CONSTITUENCY co
JOIN DEMOGRAPHIC_STATS ds ON co.constituencyId = ds.constituencyId
ORDER BY co.name, ds.ageGroup, ds.gender;

-- Query 5: Party performance across constituencies
SELECT 
    p.partyName,
    COUNT(DISTINCT c.constituencyId) as constituencies_contested,
    SUM(r.totalVotes) as total_votes_received,
    AVG(r.votePercentage) as avg_vote_percentage,
    COUNT(CASE WHEN r.totalVotes = (
        SELECT MAX(totalVotes) 
        FROM RESULT r2 
        WHERE r2.electionId = r.electionId 
        AND r2.constituencyId = r.constituencyId
    ) THEN 1 END) as seats_won,
    COUNT(CASE WHEN r.totalVotes = (
        SELECT totalVotes 
        FROM RESULT r2 
        WHERE r2.electionId = r.electionId 
        AND r2.constituencyId = r.constituencyId
        ORDER BY totalVotes DESC LIMIT 1 OFFSET 1
    ) THEN 1 END) as runner_up_count
FROM PARTY p
JOIN CANDIDATE c ON p.partyId = c.partyId
LEFT JOIN RESULT r ON c.candidateId = r.candidateId
GROUP BY p.partyId, p.partyName
ORDER BY seats_won DESC, total_votes_received DESC;

-- Query 6: Encryption and security audit
SELECT 
    v.voteId,
    v.voterId,
    vr.voterIdNumber,
    v.electionId,
    v.candidateId,
    LENGTH(v.encryptedVote) as encrypted_data_length,
    v.voteHash,
    v.timestamp,
    v.ipAddress,
    VerifyVoteHash(v.voteId, v.voteHash) as hash_verified,
    (SELECT COUNT(*) FROM AUDIT_LOG 
     WHERE userId = v.voterId 
     AND actionType = 'VOTE_CAST' 
     AND timestamp = v.timestamp) as audit_log_exists
FROM VOTE v
JOIN VOTER vr ON v.voterId = vr.voterId
ORDER BY v.timestamp DESC;

-- Query 7: Top performing candidates with voter demographics
SELECT 
    c.name as candidate_name,
    p.partyName,
    co.name as constituency,
    r.totalVotes,
    r.votePercentage,
    (SELECT ds.ageGroup 
     FROM DEMOGRAPHIC_STATS ds 
     WHERE ds.constituencyId = co.constituencyId 
     AND ds.electionId = r.electionId
     ORDER BY ds.votedCount DESC LIMIT 1) as strongest_age_group,
    (SELECT ds.gender 
     FROM DEMOGRAPHIC_STATS ds 
     WHERE ds.constituencyId = co.constituencyId 
     AND ds.electionId = r.electionId
     ORDER BY ds.votedCount DESC LIMIT 1) as dominant_gender,
    CalculateVictoryMargin(r.electionId, r.constituencyId) as victory_margin
FROM RESULT r
JOIN CANDIDATE c ON r.candidateId = c.candidateId
JOIN PARTY p ON c.partyId = p.partyId
JOIN CONSTITUENCY co ON r.constituencyId = co.constituencyId
WHERE r.totalVotes = (
    SELECT MAX(totalVotes) 
    FROM RESULT r2 
    WHERE r2.electionId = r.electionId 
    AND r2.constituencyId = r.constituencyId
)
ORDER BY r.totalVotes DESC;

-- Query 8: System security analysis - Suspicious activities
SELECT 
    al.userId,
    al.userType,
    v.voterIdNumber,
    v.name,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN al.actionStatus = 'FAILED' THEN 1 END) as failed_attempts,
    COUNT(DISTINCT al.ipAddress) as different_ips,
    GROUP_CONCAT(DISTINCT al.ipAddress) as ip_addresses,
    MIN(al.timestamp) as first_attempt,
    MAX(al.timestamp) as last_attempt,
    TIMESTAMPDIFF(MINUTE, MIN(al.timestamp), MAX(al.timestamp)) as activity_duration_minutes
FROM AUDIT_LOG al
LEFT JOIN VOTER v ON al.userId = v.voterId AND al.userType = 'VOTER'
WHERE al.actionType IN ('LOGIN', 'FACE_AUTH')
AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY al.userId, al.userType, v.voterIdNumber, v.name
HAVING failed_attempts >= 3 OR different_ips > 2
ORDER BY failed_attempts DESC, different_ips DESC;

-- Query 9: Booth-wise performance metrics
SELECT 
    b.boothId,
    b.location,
    co.name as constituency,
    bo.name as officer_name,
    COUNT(DISTINCT v.voterId) as voters_from_booth,
    COUNT(DISTINCT vt.voteId) as votes_cast,
    ROUND((COUNT(DISTINCT vt.voteId) * 100.0) / COUNT(DISTINCT v.voterId), 2) as booth_turnout,
    CalculateTurnout(co.constituencyId) as constituency_turnout
FROM BOOTH b
JOIN CONSTITUENCY co ON b.constituencyId = co.constituencyId
LEFT JOIN BOOTHOFFICER bo ON b.officerId = bo.officerId
LEFT JOIN VOTER v ON v.constituencyId = co.constituencyId
LEFT JOIN VOTE vt ON v.voterId = vt.voterId
GROUP BY b.boothId, b.location, co.name, bo.name, co.constituencyId
ORDER BY votes_cast DESC;

-- Query 10: Time-series vote encryption analysis
SELECT 
    DATE(v.timestamp) as vote_date,
    HOUR(v.timestamp) as vote_hour,
    COUNT(*) as votes_encrypted,
    AVG(LENGTH(v.encryptedVote)) as avg_encrypted_size,
    MIN(LENGTH(v.encryptedVote)) as min_encrypted_size,
    MAX(LENGTH(v.encryptedVote)) as max_encrypted_size,
    COUNT(DISTINCT v.publicKeyUsed) as unique_keys_used,
    SUM(CASE WHEN VerifyVoteHash(v.voteId, v.voteHash) THEN 1 ELSE 0 END) as verified_votes
FROM VOTE v
GROUP BY DATE(v.timestamp), HOUR(v.timestamp)
ORDER BY vote_date, vote_hour;