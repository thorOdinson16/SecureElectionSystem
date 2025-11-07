-- Procedure 1: Register new voter with face data
DELIMITER //
CREATE PROCEDURE RegisterVoter(
    IN p_name VARCHAR(255),
    IN p_dob DATE,
    IN p_gender CHAR(1),
    IN p_address VARCHAR(500),
    IN p_constituencyId BIGINT,
    IN p_voterIdNumber VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_faceImagePath VARCHAR(500),
    IN p_faceEncodingData BLOB,
    OUT p_voterId BIGINT,
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    INSERT INTO VOTER (name, dateOfBirth, gender, address, constituencyId, 
                       voterIdNumber, passwordHash, faceImagePath, faceEncodingData)
    VALUES (p_name, p_dob, p_gender, p_address, p_constituencyId, 
            p_voterIdNumber, SHA2(p_password, 256), p_faceImagePath, p_faceEncodingData);
    
    SET p_voterId = LAST_INSERT_ID();
    
    INSERT INTO AUDIT_LOG (userId, userType, actionType, actionStatus, actionDetails)
    VALUES (p_voterId, 'VOTER', 'LOGIN', 'SUCCESS', 'Voter registration completed');
    
    COMMIT;
    SET p_success = TRUE;
END//
DELIMITER ;

-- Procedure 2: Cast encrypted vote
DROP PROCEDURE IF EXISTS CastVote;
DELIMITER //

CREATE PROCEDURE CastVote(
    IN p_voterId BIGINT,
    IN p_electionId BIGINT,
    IN p_candidateId BIGINT,
    IN p_encryptedVote TEXT,
    IN p_voteHash VARCHAR(64),
    IN p_publicKey TEXT,
    IN p_ipAddress VARCHAR(45),
    OUT p_voteId BIGINT,
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 1️⃣ Record the encrypted vote
    INSERT INTO VOTE (voterId, electionId, candidateId, encryptedVote, 
                      voteHash, publicKeyUsed, ipAddress)
    VALUES (p_voterId, p_electionId, p_candidateId, p_encryptedVote, 
            p_voteHash, p_publicKey, p_ipAddress);

    SET p_voteId = LAST_INSERT_ID();

    -- 2️⃣ Record that this voter has voted in this election only
    INSERT INTO VOTER_ELECTION_STATUS (voterId, electionId, hasVoted)
    VALUES (p_voterId, p_electionId, TRUE)
    ON DUPLICATE KEY UPDATE hasVoted = TRUE;

    COMMIT;
    SET p_success = TRUE;
END//
DELIMITER ;

-- Procedure 3: Calculate and publish results
DELIMITER $$
DROP PROCEDURE IF EXISTS CalculateResults$$

CREATE PROCEDURE CalculateResults(
    IN p_electionId INT,
    IN p_constituencyId INT
)
BEGIN
    -- Delete existing results for this election and constituency
    DELETE FROM RESULT 
    WHERE electionId = p_electionId 
    AND constituencyId = p_constituencyId;
    
    -- Calculate and insert new results
    INSERT INTO RESULT (electionId, constituencyId, candidateId, totalVotes, votePercentage)
    SELECT 
        v.electionId,
        c.constituencyId,
        v.candidateId,
        COUNT(*) as totalVotes,
        ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) 
            FROM VOTE v2 
            WHERE v2.electionId = p_electionId 
            AND v2.candidateId IN (
                SELECT candidateId 
                FROM CANDIDATE 
                WHERE constituencyId = p_constituencyId
            )
        )), 2) as votePercentage
    FROM VOTE v
    JOIN CANDIDATE c ON v.candidateId = c.candidateId
    WHERE v.electionId = p_electionId
    AND c.constituencyId = p_constituencyId
    GROUP BY v.electionId, c.constituencyId, v.candidateId;
END$$

DELIMITER ;

-- Procedure 4: Update demographic statistics
DROP PROCEDURE IF EXISTS UpdateDemographicStats;
DELIMITER //
CREATE PROCEDURE UpdateDemographicStats(
    IN p_electionId BIGINT,
    IN p_constituencyId BIGINT
)
BEGIN
    -- Clear existing records
    DELETE FROM DEMOGRAPHIC_STATS
    WHERE electionId = p_electionId AND constituencyId = p_constituencyId;

    -- Insert grouped demographic stats
    INSERT INTO DEMOGRAPHIC_STATS (electionId, constituencyId, ageGroup, gender, totalVoters, votedCount, turnoutPercentage)
    SELECT
        p_electionId,
        p_constituencyId,
        CASE
            WHEN TIMESTAMPDIFF(YEAR, v.dateOfBirth, CURDATE()) < 25 THEN '<25'
            WHEN TIMESTAMPDIFF(YEAR, v.dateOfBirth, CURDATE()) BETWEEN 25 AND 35 THEN '26-35'
            WHEN TIMESTAMPDIFF(YEAR, v.dateOfBirth, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
            ELSE '>50'
        END AS ageGroup,
        v.gender,
        COUNT(*) AS totalVoters,
        SUM(CASE WHEN ve.hasVoted = TRUE THEN 1 ELSE 0 END) AS votedCount,
        ROUND(
            (SUM(CASE WHEN ve.hasVoted = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS turnoutPercentage
    FROM VOTER v
    LEFT JOIN VOTER_ELECTION_STATUS ve 
        ON v.voterId = ve.voterId AND ve.electionId = p_electionId
    WHERE v.constituencyId = p_constituencyId
    GROUP BY ageGroup, v.gender;
END//
DELIMITER ;

-- Procedure 5: Get voter authentication history
DELIMITER //
CREATE PROCEDURE GetVoterAuthHistory(
    IN p_voterId BIGINT,
    IN p_limit INT
)
BEGIN
    SELECT 
        logId,
        actionType,
        actionStatus,
        actionDetails,
        ipAddress,
        userAgent,
        timestamp
    FROM AUDIT_LOG
    WHERE userId = p_voterId AND userType = 'VOTER'
    ORDER BY timestamp DESC
    LIMIT p_limit;
END//
DELIMITER ;

-- Procedure 6: Generate election report
DELIMITER //
CREATE PROCEDURE GenerateElectionReport(
    IN p_electionId BIGINT
)
BEGIN
    SELECT 
        e.title as election_title,
        e.startTime,
        e.endTime,
        COUNT(DISTINCT v.voterId) as total_votes_cast,
        COUNT(DISTINCT c.constituencyId) as constituencies_participated,
        COUNT(DISTINCT cand.candidateId) as total_candidates,
        ROUND(AVG(r.votePercentage), 2) as avg_vote_percentage,
        MAX(r.totalVotes) as highest_votes_received,
        (SELECT name FROM CANDIDATE WHERE candidateId = (
            SELECT candidateId FROM RESULT 
            WHERE electionId = p_electionId 
            ORDER BY totalVotes DESC LIMIT 1
        )) as leading_candidate
    FROM ELECTION e
    LEFT JOIN VOTE v ON e.electionId = v.electionId
    LEFT JOIN CANDIDATE cand ON e.electionId = cand.electionId
    LEFT JOIN CONSTITUENCY c ON cand.constituencyId = c.constituencyId
    LEFT JOIN RESULT r ON e.electionId = r.electionId
    WHERE e.electionId = p_electionId
    GROUP BY e.electionId, e.title, e.startTime, e.endTime;
END//
DELIMITER ;