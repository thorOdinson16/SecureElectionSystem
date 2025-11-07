from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import models
import database as db
import auth
from face_recognition import face_recognition_system
from encryption import vote_encryption
from datetime import timedelta
import logging
import sys
import os
import tensorflow as tf

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'   # 0 = all, 1 = INFO, 2 = WARNING, 3 = ERROR
tf.get_logger().setLevel(logging.ERROR)


# Show loading progress
print("=" * 60)
print("Starting Secure Election System...")
print("=" * 60)
print("Loading libraries (this may take 30-60 seconds)...")
sys.stdout.flush()

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Request
print("✓ FastAPI loaded")
sys.stdout.flush()

from fastapi.middleware.cors import CORSMiddleware
print("✓ CORS middleware loaded")
sys.stdout.flush()

from typing import List, Optional
from datetime import timedelta
import logging

print("✓ Standard libraries loaded")
sys.stdout.flush()

import models
print("✓ Models loaded")
sys.stdout.flush()

import database as db
print("✓ Database connected")
sys.stdout.flush()

import auth
print("✓ Auth module loaded")
sys.stdout.flush()

print("\n⏳ Loading face recognition (this is the slow part - 30-40 seconds)...")
print("   Please wait while TensorFlow and FaceNet models load...")
sys.stdout.flush()

from face_recognition import face_recognition_system
print("✓ Face recognition loaded")
sys.stdout.flush()

from encryption import vote_encryption
print("✓ Encryption loaded")
sys.stdout.flush()

print("\n" + "=" * 60)
print("🎉 All modules loaded successfully!")
print("=" * 60)
print()

app = FastAPI(title="Secure Election System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to log audit
def log_audit(user_id: Optional[int], user_type: str, action_type: str, 
              action_status: str, details: str, ip_address: str):
    query = """
        INSERT INTO AUDIT_LOG (userId, userType, actionType, actionStatus, actionDetails, ipAddress)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    db.execute_query(query, (user_id, user_type, action_type, action_status, details, ip_address))

# ==================== VOTER ENDPOINTS ====================

@app.post("/api/voter/register")
async def register_voter(data: models.VoterRegistrationRequest, request: Request):
    voter = data.voter
    face_image = data.face_image
    """Register a new voter with face recognition"""
    try:
        # Register face
        success, message, encoding_data = face_recognition_system.register_face(
            voter_id=0,  # Temporary, will be updated
            base64_image=face_image
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=message)
        
        # Hash password
        hashed_password = voter.password
        
        # Call stored procedure
        query = """
            CALL RegisterVoter(%s, %s, %s, %s, %s, %s, %s, %s, %s, @voter_id, @success)
        """
        params = (
            voter.name, voter.date_of_birth, voter.gender.value, voter.address,
            voter.constituency_id, voter.voter_id_number, hashed_password,
            None, encoding_data
        )
        
        with db.get_db_cursor() as (cursor, conn):
            cursor.execute(query, params)
            cursor.execute("SELECT @voter_id, @success")
            result = cursor.fetchone()
            conn.commit()
            
            voter_id = result['@voter_id']
            success = result['@success']
            
            if success:
                # Update encoding file with actual voter_id
                face_recognition_system.register_face(voter_id, face_image)
                
                log_audit(voter_id, 'VOTER', 'LOGIN', 'SUCCESS', 
                         'Voter registration', request.client.host)
                
                return {"message": "Voter registered successfully", "voter_id": voter_id}
            else:
                raise HTTPException(status_code=500, detail="Registration failed")
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PUBLIC DATA ENDPOINTS ====================

@app.get("/api/parties")
async def get_all_parties():
    """Get all political parties"""
    query = """
        SELECT partyId, partyName, leader, symbol
        FROM PARTY
        ORDER BY partyName
    """
    return db.execute_query(query, fetch=True)

@app.get("/api/constituencies")
async def get_all_constituencies():
    """Get all constituencies"""
    query = """
        SELECT constituencyId, name, district, state
        FROM CONSTITUENCY
        ORDER BY state, district, name
    """
    return db.execute_query(query, fetch=True)

@app.get("/api/elections")
async def get_all_elections():
    """Get all elections"""
    query = """
        SELECT electionId, title, startTime, endTime, completionStatus
        FROM ELECTION
        ORDER BY startTime DESC
    """
    return db.execute_query(query, fetch=True)

@app.post("/api/voter/login")
async def login_voter(credentials: models.VoterLogin, request: Request):
    """Login voter with credentials"""
    query = "SELECT voterId, passwordHash, hasVoted FROM VOTER WHERE voterIdNumber = %s"
    voter = db.execute_query(query, (credentials.voter_id_number,), fetch_one=True)
    
    if not voter or not auth.verify_password(credentials.password, voter['passwordHash']):
        log_audit(None, 'VOTER', 'LOGIN', 'FAILED', 
                 f'Invalid credentials for {credentials.voter_id_number}', request.client.host)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    log_audit(voter['voterId'], 'VOTER', 'LOGIN', 'SUCCESS', 
             'Voter login successful', request.client.host)
    
    token = auth.create_access_token(
        data={"user_id": voter['voterId'], "user_type": "VOTER", 
              "voter_id_number": credentials.voter_id_number},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "voter_id": voter['voterId'],
        "has_voted": voter['hasVoted']
    }

@app.post("/api/voter/verify-face")
async def verify_face(data: models.FaceVerificationRequest, request: Request):
    voter_id = data.voter_id
    face_image = data.face_image
    """Verify voter's face for authentication"""
    query = "SELECT faceEncodingData FROM VOTER WHERE voterId = %s"
    voter = db.execute_query(query, (voter_id,), fetch_one=True)
    
    if not voter or not voter['faceEncodingData']:
        raise HTTPException(status_code=404, detail="Voter not found or no face data")
    
    success, message, similarity = face_recognition_system.verify_face(
        voter_id, face_image, voter['faceEncodingData']
    )
    
    status = 'SUCCESS' if success else 'FAILED'
    log_audit(voter_id, 'VOTER', 'FACE_AUTH', status, 
             f'{message} (similarity: {similarity:.2f})', request.client.host)
    
    if not success:
        raise HTTPException(status_code=401, detail=message)
    
    return {"verified": True, "similarity": similarity, "message": message}

@app.post("/api/voter/cast-vote")
async def cast_vote(vote_data: models.VoteCast, request: Request, current_user: dict = Depends(auth.get_current_user)):
    """Cast an encrypted vote"""
    voter_id = current_user['user_id']

    try:
        # Check eligibility
        query = "SELECT IsVoterEligible(%s, %s) as eligible"
        result = db.execute_query(query, (voter_id, vote_data.election_id), fetch_one=True)
        print("Eligibility Check:", result)

        if not result or not result.get("eligible"):
            raise HTTPException(status_code=403, detail="Voter not eligible to vote")

        # Get election public key
        query = "SELECT publicKeyPem FROM ELECTION WHERE electionId = %s"
        election = db.execute_query(query, (vote_data.election_id,), fetch_one=True)

        if not election or not election['publicKeyPem']:
            raise HTTPException(status_code=404, detail="Election not found or keys not generated")

        # Encrypt vote
        encrypted_vote, vote_hash = vote_encryption.encrypt_vote(vote_data.candidate_id, election['publicKeyPem'])

        with db.get_db_cursor() as (cursor, conn):
            # Create MySQL session variable for INOUT
            cursor.execute("SET @attempt_count = 0;")

            # Call stored procedure with @attempt_count as INOUT variable
            cursor.execute("""
                CALL CastVote(%s, %s, %s, %s, %s, %s, %s, @attempt_count, @vote_id, @success)
            """, (
                voter_id, vote_data.election_id, vote_data.candidate_id,
                encrypted_vote, vote_hash, election['publicKeyPem'], request.client.host
            ))

            # Fetch OUT and INOUT results
            cursor.execute("SELECT @attempt_count AS attempt_count, @vote_id AS vote_id, @success AS success;")
            result = cursor.fetchone()
            conn.commit()

        print("Vote Insert Result:", result)

        if result and result['success']:
            return {
                "message": "Vote cast successfully",
                "vote_id": result['vote_id'],
                "vote_hash": vote_hash,
                "attempt_count": result['attempt_count']
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to cast vote")

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/api/voter/profile")
async def get_voter_profile(current_user: dict = Depends(auth.get_current_user)):
    """Get voter profile"""
    query = """
        SELECT v.*, c.name as constituency_name, c.district, c.state
        FROM VOTER v
        JOIN CONSTITUENCY c ON v.constituencyId = c.constituencyId
        WHERE v.voterId = %s
    """
    voter = db.execute_query(query, (current_user['user_id'],), fetch_one=True)
    
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")
    
    # Remove sensitive data
    voter.pop('passwordHash', None)
    voter.pop('faceEncodingData', None)
    
    return voter

# ==================== ELECTION ENDPOINTS ====================

@app.get("/api/elections/active")
async def get_active_elections():
    """Get all active elections"""
    query = """
        SELECT electionId, title, startTime, endTime, completionStatus
        FROM ELECTION
        WHERE NOW() BETWEEN startTime AND endTime
          AND completionStatus = 0
        ORDER BY startTime ASC
    """
    elections = db.execute_query(query, fetch=True)
    return elections

@app.get("/api/elections/{election_id}/candidates")
async def get_candidates(election_id: int, constituency_id: int):
    """Get candidates for an election and constituency"""
    query = """
        SELECT c.*, p.partyName, p.leader
        FROM CANDIDATE c
        JOIN PARTY p ON c.partyId = p.partyId
        WHERE c.electionId = %s AND c.constituencyId = %s
    """
    return db.execute_query(query, (election_id, constituency_id), fetch=True)

# ==================== ADMIN ENDPOINTS ====================

@app.post("/api/admin/login")
async def admin_login(credentials: models.AdminLogin, request: Request):
    """Admin login"""
    query = "SELECT adminId, passwordHash, role FROM ADMIN WHERE email = %s"
    admin = db.execute_query(query, (credentials.email,), fetch_one=True)
    
    if not admin or not auth.verify_password(credentials.password, admin['passwordHash']):
        log_audit(None, 'ADMIN', 'LOGIN', 'FAILED', 
                 f'Invalid credentials for {credentials.email}', request.client.host)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    log_audit(admin['adminId'], 'ADMIN', 'LOGIN', 'SUCCESS', 
             'Admin login successful', request.client.host)
    
    token = auth.create_access_token(
        data={"user_id": admin['adminId'], "user_type": "ADMIN", "role": admin['role']},
        expires_delta=timedelta(minutes=60)
    )
    
    return {"access_token": token, "token_type": "bearer", "role": admin['role']}

@app.get("/api/constituency/{constituency_id}/turnout/{election_id}")
async def get_turnout(constituency_id: int, election_id: int):
    result = db.execute_query(
        "SELECT CalculateTurnout(%s, %s) AS turnout",
        (constituency_id, election_id),
        fetch_one=True
    )
    return {"turnout_percentage": float(result['turnout'])}


@app.get("/api/election/{election_id}/total-votes")
async def get_total_votes(election_id: int):
    """Public: Total votes cast in election"""
    result = db.execute_query("SELECT GetTotalVotes(%s) as total", (election_id,), fetch_one=True)
    return {"total_votes": int(result['total'])}

@app.get("/api/voter/{voter_id}/auth-success-rate")
async def get_auth_success_rate(voter_id: int, current_user: dict = Depends(auth.get_current_user)):
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(403, "Admin only")
    result = db.execute_query("SELECT GetAuthSuccessRate(%s) as rate", (voter_id,), fetch_one=True)
    return {"success_rate": float(result['rate'])}

@app.get("/api/vote/verify/{vote_id}")
async def verify_vote_hash(vote_id: int, hash: str):
    """Public: Voter receipt verification"""
    result = db.execute_query("SELECT VerifyVoteHash(%s, %s) as valid", (vote_id, hash), fetch_one=True)
    return {"valid": bool(result['valid'])}

@app.post("/api/admin/vote/decrypt/{vote_id}")
async def decrypt_vote_admin(vote_id: int, current_user: dict = Depends(auth.get_current_user)):
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(403, "Admin only")

    # Get private key and encrypted vote
    vote = db.execute_query("SELECT encryptedVote, e.privateKeyPem FROM VOTE v JOIN ELECTION e ON v.electionId = e.electionId WHERE v.voteId = %s", (vote_id,), fetch_one=True)
    if not vote:
        raise HTTPException(404, "Vote not found")

    try:
        candidate_id = vote_encryption.decrypt_vote(vote['encryptedVote'], vote['privateKeyPem'])
        # Audit
        log_audit(current_user['user_id'], 'ADMIN', 'VOTE_DECRYPT', 'SUCCESS', f"Decrypted vote {vote_id}", "N/A")
        return {"vote_id": vote_id, "candidate_id": candidate_id}
    except Exception as e:
        log_audit(current_user['user_id'], 'ADMIN', 'VOTE_DECRYPT', 'FAILED', f"Vote {vote_id}: {str(e)}", "N/A")
        raise HTTPException(500, "Decryption failed")

@app.post("/api/admin/elections")
async def create_election(election: models.ElectionCreate, request: Request,
                         current_user: dict = Depends(auth.get_current_user)):
    """Create new election with encryption keys"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate keypair
    public_key, private_key = vote_encryption.generate_keypair()
    
    query = """
        INSERT INTO ELECTION (title, startTime, endTime, publicKeyPem, privateKeyPem)
        VALUES (%s, %s, %s, %s, %s)
    """
    election_id = db.execute_query(
        query, 
        (election.title, election.start_time, election.end_time, public_key, private_key)
    )
    
    log_audit(current_user['user_id'], 'ADMIN', 'ELECTION_CREATE', 'SUCCESS',
             f'Election {election_id} created', request.client.host)
    
    return {"election_id": election_id, "message": "Election created successfully"}

@app.post("/api/admin/candidates")
async def add_candidate(candidate: models.CandidateCreate, request: Request,
                       current_user: dict = Depends(auth.get_current_user)):
    """Add candidate to election"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = """
        INSERT INTO CANDIDATE (name, age, partyId, electionId, constituencyId, criminalRecords)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    candidate_id = db.execute_query(
        query,
        (candidate.name, candidate.age, candidate.party_id, candidate.election_id,
         candidate.constituency_id, candidate.criminal_records)
    )
    
    log_audit(current_user['user_id'], 'ADMIN', 'CANDIDATE_ADD', 'SUCCESS',
             f'Candidate {candidate_id} added', request.client.host)
    
    return {"candidate_id": candidate_id, "message": "Candidate added successfully"}

@app.post("/api/admin/results/calculate-all/{election_id}")
async def calculate_all_results(election_id: int, request: Request,
                                current_user: dict = Depends(auth.get_current_user)):
    """Calculate results for all constituencies in an election"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all constituencies that have candidates in this election
    query = """
        SELECT DISTINCT constituencyId 
        FROM CANDIDATE 
        WHERE electionId = %s
    """
    constituencies = db.execute_query(query, (election_id,), fetch=True)
    
    if not constituencies:
        raise HTTPException(status_code=404, detail="No constituencies found for this election")
    
    results_summary = []
    for constituency in constituencies:
        constituency_id = constituency['constituencyId']
        try:
            db.call_procedure('CalculateResults', (election_id, constituency_id))
            results_summary.append({
                'constituency_id': constituency_id,
                'status': 'success'
            })
        except Exception as e:
            results_summary.append({
                'constituency_id': constituency_id,
                'status': 'failed',
                'error': str(e)
            })
    
    log_audit(current_user['user_id'], 'ADMIN', 'CALCULATE_RESULTS', 'SUCCESS',
             f'Calculated results for election {election_id}', request.client.host)
    
    return {
        "message": f"Results calculated for {len(constituencies)} constituencies",
        "details": results_summary
    }

@app.post("/api/admin/results/calculate/{election_id}/{constituency_id}")
async def calculate_results(election_id: int, constituency_id: int, request: Request,
                           current_user: dict = Depends(auth.get_current_user)):
    """Calculate and publish results"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db.call_procedure('CalculateResults', (election_id, constituency_id))
    return {"message": "Results calculated and published successfully"}

@app.get("/api/admin/results/{election_id}")
async def get_results(election_id: int, current_user: dict = Depends(auth.get_current_user)):
    """Get election results"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Use Query 1 from complex_queries.sql
    query = """
        SELECT 
            e.title as election_name,
            co.constituencyId,
            co.name as constituency,
            c.name as candidate_name,
            p.partyName,
            r.totalVotes,
            r.votePercentage,
            CalculateVictoryMargin(e.electionId, co.constituencyId) as victory_margin,
            RANK() OVER (PARTITION BY e.electionId, co.constituencyId 
                        ORDER BY r.totalVotes DESC) as rank_position
        FROM ELECTION e
        JOIN RESULT r ON e.electionId = r.electionId
        JOIN CANDIDATE c ON r.candidateId = c.candidateId
        JOIN PARTY p ON c.partyId = p.partyId
        JOIN CONSTITUENCY co ON r.constituencyId = co.constituencyId
        WHERE e.electionId = %s
        ORDER BY co.constituencyId, r.totalVotes DESC
    """
    return db.execute_query(query, (election_id,), fetch=True)

@app.get("/api/admin/analytics/voting-patterns")
async def get_voting_patterns(election_id: int, current_user: dict = Depends(auth.get_current_user)):
    """Get hourly voting patterns"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Query 3 from complex_queries.sql
    query = """
        SELECT 
            DATE(v.timestamp) as voting_date,
            HOUR(v.timestamp) as voting_hour,
            COUNT(*) as votes_cast,
            COUNT(DISTINCT v.voterId) as unique_voters
        FROM VOTE v
        WHERE v.electionId = %s
        GROUP BY DATE(v.timestamp), HOUR(v.timestamp)
        ORDER BY voting_date, voting_hour
    """
    return db.execute_query(query, (election_id,), fetch=True)

@app.get("/api/admin/analytics/demographics/{election_id}/{constituency_id}")
async def get_demographic_stats(election_id: int, constituency_id: int,
                                current_user: dict = Depends(auth.get_current_user)):
    """Get demographic voting statistics"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update demographic stats first
    db.call_procedure('UpdateDemographicStats', (election_id, constituency_id))
    
    # Query 4 from complex_queries.sql
    query = """
        SELECT 
            ds.ageGroup,
            ds.gender,
            ds.totalVoters,
            ds.votedCount,
            ds.turnoutPercentage
        FROM DEMOGRAPHIC_STATS ds
        WHERE ds.electionId = %s AND ds.constituencyId = %s
        ORDER BY ds.ageGroup, ds.gender
    """
    return db.execute_query(query, (election_id, constituency_id), fetch=True)

@app.get("/api/admin/security/suspicious-activities")
async def get_suspicious_activities(current_user: dict = Depends(auth.get_current_user)):
    """Get suspicious login activities"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Query 8 from complex_queries.sql
    query = """
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
            MAX(al.timestamp) as last_attempt
        FROM AUDIT_LOG al
        LEFT JOIN VOTER v ON al.userId = v.voterId AND al.userType = 'VOTER'
        WHERE al.actionType IN ('LOGIN', 'FACE_AUTH')
        AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY al.userId, al.userType, v.voterIdNumber, v.name
        HAVING failed_attempts >= 3 OR different_ips > 2
        ORDER BY failed_attempts DESC, different_ips DESC
    """
    return db.execute_query(query, fetch=True)

@app.get("/api/admin/audit-logs")
async def get_audit_logs(limit: int = 100, current_user: dict = Depends(auth.get_current_user)):
    """Get recent audit logs"""
    if current_user['user_type'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Query 2 from complex_queries.sql (modified)
    query = """
        SELECT 
            v.voterIdNumber,
            v.name,
            COUNT(CASE WHEN al.actionType = 'LOGIN' AND al.actionStatus = 'SUCCESS' THEN 1 END) as successful_logins,
            COUNT(CASE WHEN al.actionType = 'LOGIN' AND al.actionStatus = 'FAILED' THEN 1 END) as failed_logins,
            COUNT(CASE WHEN al.actionType = 'FACE_AUTH' AND al.actionStatus = 'SUCCESS' THEN 1 END) as face_auth_success,
            COUNT(CASE WHEN al.actionType = 'FACE_AUTH' AND al.actionStatus = 'FAILED' THEN 1 END) as face_auth_failed,
            MIN(al.timestamp) as first_attempt,
            MAX(al.timestamp) as last_attempt
        FROM VOTER v
        LEFT JOIN AUDIT_LOG al ON v.voterId = al.userId AND al.userType = 'VOTER'
        GROUP BY v.voterId, v.voterIdNumber, v.name
        HAVING COUNT(al.logId) > 0
        ORDER BY failed_logins DESC
        LIMIT %s
    """
    return db.execute_query(query, (limit,), fetch=True)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("🚀 Starting FastAPI server...")
    print("=" * 60)
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    print("=" * 60)
    print("\nPress CTRL+C to stop the server\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)