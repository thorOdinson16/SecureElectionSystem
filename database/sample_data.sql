-- Allow file reading (session-level override)
SET SESSION sql_mode = '';

-- Verify your folder is accessible
SHOW VARIABLES LIKE 'secure_file_priv';

-- Insert Constituencies
INSERT INTO CONSTITUENCY (name, district, state, totalPopulation) VALUES
('Bengaluru North', 'Bengaluru Urban', 'Karnataka', 2500000),
('Bengaluru South', 'Bengaluru Urban', 'Karnataka', 2800000),
('Bengaluru Central', 'Bengaluru Urban', 'Karnataka', 1200000);

-- Insert Parties (Make sure these files exist and MySQL has read permission)
INSERT INTO PARTY (partyName, symbol, leader, foundedYear) VALUES
('Most Secular Party', LOAD_FILE('C:/Users/Admin/Documents/DBMS_Sem5/mini-project/images/party/MSP.png'), 'KGB', 1980),
('Family Run Party', LOAD_FILE('C:/Users/Admin/Documents/DBMS_Sem5/mini-project/images/party/FRP.png'), 'Pushpesh', 1885),
('One Big Party', LOAD_FILE('C:/Users/Admin/Documents/DBMS_Sem5/mini-project/images/party/OBP.jpeg'), 'Nograj', 1999);

-- Insert Admin
INSERT INTO ADMIN (name, email, passwordHash, role) VALUES
('Election Commissioner', 'admin@election.gov', SHA2('admin123', 256), 'SUPER_ADMIN'),
('Deputy Commissioner', 'deputy@election.gov', SHA2('deputy123', 256), 'ADMIN');

-- Insert Booth Officers
INSERT INTO BOOTHOFFICER (name, email, phone, passwordHash) VALUES
('Officer Suresh', 'suresh@election.gov', '9876543210', SHA2('officer123', 256)),
('Officer Lakshmi', 'lakshmi@election.gov', '9876543211', SHA2('officer123', 256)),
('Officer Raghu', 'raghu@election.gov', '9876543212', SHA2('officer123', 256));

-- Insert Booths
INSERT INTO BOOTH (location, constituencyId, officerId, capacity) VALUES
('Shivajinagar Polling Station', 3, 3, 1500),
('Jayanagar Polling Station', 2, 2, 1200),
('Vidhana Soudha Station', 1, 1, 2000);

-- Insert Voters
INSERT INTO VOTER (name, dateOfBirth, gender, address, constituencyId, voterIdNumber, passwordHash) VALUES
('Rahul Sharma', '1990-05-15', 'M', '123 MG Road, Bengaluru', 1, 'VID2024001', SHA2('voter123', 256)),
('Priya Patel', '1985-08-22', 'F', '456 Brigade Road, Bengaluru', 1, 'VID2024002', SHA2('voter123', 256)),
('Amit Kumar', '1992-03-10', 'M', '789 Residency Road, Bengaluru', 2, 'VID2024003', SHA2('voter123', 256));

-- Insert Election
INSERT INTO ELECTION (title, startTime, endTime) VALUES
('General Election 2024', '2024-11-01 08:00:00', '2024-11-01 18:00:00');

-- Insert Candidates
INSERT INTO CANDIDATE (name, age, partyId, electionId, constituencyId) VALUES
('Krishna Gundu Bala', 45, 1, 1, 1),
('Pushpesh', 52, 2, 1, 1),
('Nograj', 38, 3, 1, 1);