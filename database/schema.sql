-- Create Database
CREATE DATABASE IF NOT EXISTS SecureElectionDB;
USE SecureElectionDB;

-- 1. CONSTITUENCY Table
CREATE TABLE CONSTITUENCY (
    constituencyId BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    totalPopulation INT DEFAULT 0,
    INDEX idx_constituency_state (state),
    INDEX idx_constituency_district (district)
);

-- 2. PARTY Table
CREATE TABLE PARTY (
    partyId BIGINT PRIMARY KEY AUTO_INCREMENT,
    partyName VARCHAR(255) NOT NULL UNIQUE,
    symbol BLOB NOT NULL,
    leader VARCHAR(255) NOT NULL,
    foundedYear INT,
    INDEX idx_party_name (partyName)
);

-- 3. ELECTION Table
CREATE TABLE ELECTION (
    electionId BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP NOT NULL,
    completionStatus BOOLEAN DEFAULT FALSE,
    publicKeyPem TEXT,
    privateKeyPem TEXT,
    CHECK (endTime > startTime),
    INDEX idx_election_status (completionStatus),
    INDEX idx_election_dates (startTime, endTime)
);

-- 4. ADMIN Table
CREATE TABLE ADMIN (
    adminId BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastLoginAt TIMESTAMP NULL,
    INDEX idx_admin_email (email)
);

-- 5. VOTER Table (with Face Recognition)
CREATE TABLE VOTER (
    voterId BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    dateOfBirth DATE NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    address VARCHAR(500) NOT NULL,
    hasVoted BOOLEAN DEFAULT FALSE,
    constituencyId BIGINT NOT NULL,
    voterIdNumber VARCHAR(50) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    faceImagePath VARCHAR(500),
    faceEncodingData BLOB,
    registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastLoginAt TIMESTAMP NULL,
    FOREIGN KEY (constituencyId) REFERENCES CONSTITUENCY(constituencyId) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_voter_constituency (constituencyId),
    INDEX idx_voter_voted_status (hasVoted),
    INDEX idx_voter_id (voterIdNumber)
);

-- 6. AUDIT_LOG Table (Comprehensive Logging)
CREATE TABLE AUDIT_LOG (
    logId BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT,
    userType ENUM('VOTER', 'ADMIN', 'OFFICER') NOT NULL,
    actionType ENUM('LOGIN', 'LOGOUT', 'FACE_AUTH', 'VOTE_CAST', 
                    'VOTE_VIEW', 'ELECTION_CREATE', 'ELECTION_UPDATE',
                    'CANDIDATE_ADD', 'RESULT_PUBLISH') NOT NULL,
    actionStatus ENUM('SUCCESS', 'FAILED') NOT NULL,
    actionDetails TEXT,
    ipAddress VARCHAR(45),
    userAgent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_user (userId, userType),
    INDEX idx_log_action (actionType),
    INDEX idx_log_timestamp (timestamp),
    INDEX idx_log_status (actionStatus)
);

-- 7. CANDIDATE Table
CREATE TABLE CANDIDATE (
    candidateId BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age >= 25),
    partyId BIGINT NOT NULL,
    electionId BIGINT NOT NULL,
    constituencyId BIGINT NOT NULL,
    imageUrl VARCHAR(500),
    criminalRecords TEXT,
    FOREIGN KEY (partyId) REFERENCES PARTY(partyId) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (electionId) REFERENCES ELECTION(electionId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (constituencyId) REFERENCES CONSTITUENCY(constituencyId) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_candidate_election (electionId, constituencyId, candidateId),
    INDEX idx_candidate_election (electionId),
    INDEX idx_candidate_constituency (constituencyId),
    INDEX idx_candidate_party (partyId)
);

-- 8. BOOTHOFFICER Table
CREATE TABLE BOOTHOFFICER (
    officerId BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_officer_email (email)
);

-- 9. BOOTH Table
CREATE TABLE BOOTH (
    boothId BIGINT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(500) NOT NULL,
    constituencyId BIGINT NOT NULL,
    officerId BIGINT,
    capacity INT DEFAULT 1000 CHECK (capacity > 0),
    FOREIGN KEY (constituencyId) REFERENCES CONSTITUENCY(constituencyId) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (officerId) REFERENCES BOOTHOFFICER(officerId) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_booth_constituency (constituencyId),
    INDEX idx_booth_officer (officerId)
);

-- 10. VOTE Table (with End-to-End Encryption)
CREATE TABLE VOTE (
    voteId BIGINT PRIMARY KEY AUTO_INCREMENT,
    voterId BIGINT NOT NULL,
    electionId BIGINT NOT NULL,
    candidateId BIGINT NOT NULL,
    encryptedVote TEXT NOT NULL,
    voteHash VARCHAR(64) NOT NULL,
    publicKeyUsed TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    FOREIGN KEY (voterId) REFERENCES VOTER(voterId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (electionId) REFERENCES ELECTION(electionId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (candidateId) REFERENCES CANDIDATE(candidateId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_voter_election (voterId, electionId),
    INDEX idx_vote_election (electionId),
    INDEX idx_vote_candidate (candidateId),
    INDEX idx_vote_timestamp (timestamp)
);

-- 11. RESULT Table
CREATE TABLE RESULT (
    resultId BIGINT PRIMARY KEY AUTO_INCREMENT,
    electionId BIGINT NOT NULL,
    candidateId BIGINT NOT NULL,
    constituencyId BIGINT NOT NULL,
    totalVotes BIGINT DEFAULT 0 CHECK (totalVotes >= 0),
    votePercentage DECIMAL(5,2),
    publishedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (electionId) REFERENCES ELECTION(electionId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (candidateId) REFERENCES CANDIDATE(candidateId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (constituencyId) REFERENCES CONSTITUENCY(constituencyId) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_result (electionId, candidateId, constituencyId),
    INDEX idx_result_election (electionId),
    INDEX idx_result_constituency (constituencyId)
);

-- 12. DEMOGRAPHIC_STATS Table (for Analytics Dashboard)
CREATE TABLE DEMOGRAPHIC_STATS (
    statId BIGINT PRIMARY KEY AUTO_INCREMENT,
    electionId BIGINT NOT NULL,
    constituencyId BIGINT NOT NULL,
    ageGroup VARCHAR(20),
    gender CHAR(1),
    totalVoters INT DEFAULT 0,
    votedCount INT DEFAULT 0,
    turnoutPercentage DECIMAL(5,2),
    FOREIGN KEY (electionId) REFERENCES ELECTION(electionId) ON DELETE CASCADE,
    FOREIGN KEY (constituencyId) REFERENCES CONSTITUENCY(constituencyId) ON DELETE CASCADE,
    INDEX idx_demo_election (electionId),
    INDEX idx_demo_constituency (constituencyId)
);

-- 13. VOTER_ELECTION_STATUS Table (to track voting status per election)
CREATE TABLE VOTER_ELECTION_STATUS (
    voterId BIGINT NOT NULL,
    electionId BIGINT NOT NULL,
    hasVoted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (voterId, electionId),
    FOREIGN KEY (voterId) REFERENCES VOTER(voterId),
    FOREIGN KEY (electionId) REFERENCES ELECTION(electionId)
);
