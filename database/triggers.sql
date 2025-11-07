-- Trigger 1: Auto-update hasVoted when vote is cast
DELIMITER //
CREATE TRIGGER after_vote_insert
AFTER INSERT ON VOTE
FOR EACH ROW
BEGIN
    UPDATE VOTER 
    SET hasVoted = TRUE 
    WHERE voterId = NEW.voterId;
    
    -- Log the vote casting
    INSERT INTO AUDIT_LOG (userId, userType, actionType, actionStatus, actionDetails, ipAddress)
    VALUES (NEW.voterId, 'VOTER', 'VOTE_CAST', 'SUCCESS', 
            CONCAT('Vote cast for election ', NEW.electionId), NEW.ipAddress);
END//
DELIMITER ;

-- Trigger 2: Prevent voting after election ends
DELIMITER //
CREATE TRIGGER before_vote_insert
BEFORE INSERT ON VOTE
FOR EACH ROW
BEGIN
    DECLARE election_end TIMESTAMP;
    DECLARE election_start TIMESTAMP;
    
    SELECT startTime, endTime INTO election_start, election_end
    FROM ELECTION
    WHERE electionId = NEW.electionId;
    
    IF CURRENT_TIMESTAMP < election_start THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Election has not started yet';
    END IF;
    
    IF CURRENT_TIMESTAMP > election_end THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Election has already ended';
    END IF;
END//
DELIMITER ;

-- Trigger 3: Validate voter eligibility
DELIMITER //

CREATE TRIGGER before_voter_vote
BEFORE INSERT ON vote
FOR EACH ROW
BEGIN
    DECLARE already_voted INT;

    -- Check if voter already voted in THIS election (not globally)
    SELECT COUNT(*) INTO already_voted
    FROM vote
    WHERE voterId = NEW.voterId
      AND electionId = NEW.electionId;

    IF already_voted > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Voter has already voted in this election';
    END IF;
END//
DELIMITER ;
