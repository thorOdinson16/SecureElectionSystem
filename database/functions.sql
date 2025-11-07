-- Function 1: Calculate voter turnout percentage
DELIMITER //
CREATE FUNCTION CalculateTurnout(p_constituencyId BIGINT, p_electionId BIGINT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_voters INT DEFAULT 0;
    DECLARE voted_count INT DEFAULT 0;

    -- total voters linked to this constituency and election (via candidate presence)
    SELECT COUNT(DISTINCT v.voterId)
    INTO total_voters
    FROM VOTER v
    WHERE v.constituencyId = p_constituencyId;

    -- voters who actually voted in this election and constituency
    SELECT COUNT(DISTINCT vt.voterId)
    INTO voted_count
    FROM VOTE vt
    JOIN CANDIDATE c ON vt.candidateId = c.candidateId
    WHERE c.constituencyId = p_constituencyId
      AND vt.electionId = p_electionId;

    IF total_voters = 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND((voted_count * 100.0) / total_voters, 2);
END//
DELIMITER ;

-- Function 2: Get winner for constituency
DELIMITER //
CREATE FUNCTION GetWinner(p_electionId BIGINT, p_constituencyId BIGINT)
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
    DECLARE winner_name VARCHAR(255);
    
    SELECT c.name INTO winner_name
    FROM RESULT r
    JOIN CANDIDATE c ON r.candidateId = c.candidateId
    WHERE r.electionId = p_electionId 
    AND r.constituencyId = p_constituencyId
    ORDER BY r.totalVotes DESC
    LIMIT 1;
    
    RETURN IFNULL(winner_name, 'No votes yet');
END//
DELIMITER ;

-- Function 3: Check if voter is eligible
DELIMITER //

CREATE FUNCTION IsVoterEligible(p_voterId BIGINT, p_electionId BIGINT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE voter_age INT DEFAULT 0;
    DECLARE election_active BOOLEAN DEFAULT FALSE;
    DECLARE already_voted BOOLEAN DEFAULT FALSE;
    DECLARE election_start TIMESTAMP;
    DECLARE election_end TIMESTAMP;

    -- Get voter's age
    SELECT TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE())
    INTO voter_age
    FROM voter
    WHERE voterId = p_voterId;

    -- Check if election is active
    SELECT startTime, endTime
    INTO election_start, election_end
    FROM election
    WHERE electionId = p_electionId;

    IF CURRENT_TIMESTAMP BETWEEN election_start AND election_end THEN
        SET election_active = TRUE;
    ELSE
        SET election_active = FALSE;
    END IF;

    -- Check if the voter has already voted in this election
    SELECT COUNT(*) > 0
    INTO already_voted
    FROM vote
    WHERE voterId = p_voterId
      AND electionId = p_electionId;

    -- Final eligibility check
    IF voter_age >= 18 AND election_active AND NOT already_voted THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END//
DELIMITER ;

-- Function 4: Get total votes in election
DELIMITER //
CREATE FUNCTION GetTotalVotes(p_electionId BIGINT)
RETURNS BIGINT
DETERMINISTIC
BEGIN
    DECLARE total BIGINT;
    
    SELECT COUNT(*) INTO total
    FROM VOTE
    WHERE electionId = p_electionId;
    
    RETURN IFNULL(total, 0);
END//
DELIMITER ;

-- Function 5: Calculate victory margin
DELIMITER //
CREATE FUNCTION CalculateVictoryMargin(p_electionId BIGINT, p_constituencyId BIGINT)
RETURNS BIGINT
DETERMINISTIC
BEGIN
    DECLARE first_votes BIGINT;
    DECLARE second_votes BIGINT;
    
    SELECT totalVotes INTO first_votes
    FROM RESULT
    WHERE electionId = p_electionId AND constituencyId = p_constituencyId
    ORDER BY totalVotes DESC
    LIMIT 1;
    
    SELECT totalVotes INTO second_votes
    FROM RESULT
    WHERE electionId = p_electionId AND constituencyId = p_constituencyId
    ORDER BY totalVotes DESC
    LIMIT 1 OFFSET 1;
    
    RETURN IFNULL(first_votes, 0) - IFNULL(second_votes, 0);
END//
DELIMITER ;

-- Function 6: Get authentication success rate
DELIMITER //
CREATE FUNCTION GetAuthSuccessRate(p_voterId BIGINT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_attempts INT;
    DECLARE successful_attempts INT;
    
    SELECT COUNT(*) INTO total_attempts
    FROM AUDIT_LOG
    WHERE userId = p_voterId 
    AND userType = 'VOTER'
    AND actionType IN ('LOGIN', 'FACE_AUTH');
    
    SELECT COUNT(*) INTO successful_attempts
    FROM AUDIT_LOG
    WHERE userId = p_voterId 
    AND userType = 'VOTER'
    AND actionType IN ('LOGIN', 'FACE_AUTH')
    AND actionStatus = 'SUCCESS';
    
    IF total_attempts = 0 THEN
        RETURN 0.00;
    END IF;
    
    RETURN ROUND((successful_attempts * 100.0) / total_attempts, 2);
END//
DELIMITER ;

-- Function 7: Verify vote hash
DELIMITER //
CREATE FUNCTION VerifyVoteHash(p_voteId BIGINT, p_providedHash VARCHAR(64))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE stored_hash VARCHAR(64);
    
    SELECT voteHash INTO stored_hash
    FROM VOTE
    WHERE voteId = p_voteId;
    
    RETURN stored_hash = p_providedHash;
END//
DELIMITER ;