# 🗳️ Secure Election System

A comprehensive, secure, and transparent electronic voting platform featuring facial recognition authentication, end-to-end encryption, and real-time analytics.

## 🌟 Features

### Core Functionality
- **Biometric Authentication**: MTCNN + FaceNet facial recognition for voter verification
- **End-to-End Encryption**: RSA encryption for vote security and privacy
- **Real-time Results**: Live vote counting and result visualization
- **Comprehensive Audit Trail**: Complete logging of all system activities
- **Multi-role Access**: Separate interfaces for voters and administrators

### Security Features
- JWT-based authentication
- Encrypted vote storage
- Vote receipt verification system
- Suspicious activity detection
- IP address tracking and logging
- Prevention of double voting

### Analytics & Reporting
- Demographic voting statistics
- Hourly voting patterns
- Turnout percentage calculations
- Victory margin analysis
- Interactive charts and visualizations

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18
- React Router for navigation
- Recharts for data visualization
- React Webcam for face capture
- Axios for API communication

**Backend**
- FastAPI (Python)
- MySQL database
- JWT authentication
- OpenCV for image processing
- TensorFlow/Keras for facial recognition
- Cryptography library for encryption

**Machine Learning**
- MTCNN for face detection
- FaceNet for face encoding
- Real-time face verification

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Webcam (for facial recognition)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd secure-election-system
```

### 2. Database Setup

**Windows:**
```bash
cd database
setup_database.bat
```

**Manual Setup:**
```bash
mysql -u root -p < schema.sql
mysql -u root -p SecureElectionDB < triggers.sql
mysql -u root -p SecureElectionDB < procedures.sql
mysql -u root -p SecureElectionDB < functions.sql
mysql -u root -p SecureElectionDB < sample_data.sql
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo DB_PASSWORD=your_mysql_password > .env

# Generate encryption keys for existing election
python generate_existing_keys.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Start Backend Server

```bash
cd backend
python main.py
```

The backend will start on `http://localhost:8000`
The frontend will start on `http://localhost:3000`

## 📖 Usage

### For Voters

1. **Registration**
   - Navigate to `/voter/register`
   - Fill in personal details
   - Capture face photo for biometric registration
   - Create secure password

2. **Voting**
   - Login at `/voter/login`
   - Verify identity using facial recognition
   - Select election and candidate
   - Confirm vote (irreversible)
   - Receive vote receipt for verification

3. **Vote Verification**
   - Use the verification link from your receipt
   - Confirm your vote was recorded correctly

### For Administrators

1. **Login**
   - Access admin portal at `/admin/login`
   - Default credentials:
     - Email: `admin@election.gov`
     - Password: `admin123`

2. **Election Management**
   - Create new elections
   - Add candidates to constituencies
   - Set election start/end times
   - Manage political parties

3. **Results & Analytics**
   - Calculate results for constituencies
   - View real-time voting patterns
   - Analyze demographic statistics
   - Monitor suspicious activities
   - Export audit logs

## 🗄️ Database Schema

### Key Tables

- **VOTER**: Stores voter information and face encodings
- **ELECTION**: Election details with RSA key pairs
- **CANDIDATE**: Candidate information per election
- **VOTE**: Encrypted votes with verification hashes
- **RESULT**: Calculated election results
- **AUDIT_LOG**: Comprehensive activity logging
- **DEMOGRAPHIC_STATS**: Voting analytics by age/gender

### Stored Procedures

- `RegisterVoter`: Register new voter with face data
- `CastVote`: Cast encrypted vote with duplicate prevention
- `CalculateResults`: Calculate and publish results
- `UpdateDemographicStats`: Update voting statistics

### Functions

- `CalculateTurnout`: Calculate voter turnout percentage
- `GetWinner`: Get winning candidate for constituency
- `IsVoterEligible`: Check voter eligibility
- `VerifyVoteHash`: Verify vote receipt authenticity

## 🔐 Security Measures

1. **Authentication**
   - JWT tokens with expiration
   - Password hashing using SHA-256
   - Multi-factor authentication via face recognition

2. **Encryption**
   - RSA 2048-bit encryption for votes
   - Unique key pairs per election
   - Vote hash generation for verification

3. **Audit Trail**
   - All actions logged with timestamps
   - IP address tracking
   - Success/failure status recording
   - User agent information

4. **Vote Integrity**
   - Prevention of double voting
   - Immutable vote records
   - Cryptographic vote verification
   - Tamper-evident hashing

## 📊 API Endpoints

### Public Endpoints
- `GET /api/parties` - Get all political parties
- `GET /api/constituencies` - Get all constituencies
- `GET /api/elections` - Get all elections
- `GET /api/elections/active` - Get active elections

### Voter Endpoints
- `POST /api/voter/register` - Register new voter
- `POST /api/voter/login` - Voter authentication
- `POST /api/voter/verify-face` - Face verification
- `POST /api/voter/cast-vote` - Cast encrypted vote
- `GET /api/voter/profile` - Get voter profile

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/elections` - Create election
- `POST /api/admin/candidates` - Add candidate
- `POST /api/admin/results/calculate/{electionId}/{constituencyId}` - Calculate results
- `GET /api/admin/results/{electionId}` - Get election results
- `GET /api/admin/analytics/voting-patterns` - Get voting patterns
- `GET /api/admin/security/suspicious-activities` - Get security alerts

## 🎨 Frontend Components

- **VoterRegistration**: Multi-step registration with face capture
- **VoterLogin**: Authentication interface
- **VotingPage**: Secure voting workflow
- **FaceCapture**: Webcam integration for biometric auth
- **AdminDashboard**: Comprehensive admin interface
- **ElectionManagement**: Create elections and add candidates
- **ResultsDisplay**: Interactive results visualization
- **VoteVerification**: Receipt verification system

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DB_PASSWORD=your_mysql_password
SECRET_KEY=your-secret-key-here-change-in-production
```

### Database Configuration

Edit `backend/database.py` to modify:
- Database host
- Port
- Connection pool size

## 🧪 Testing

### Test Voter Credentials
After running `sample_data.sql`:
- Voter ID: `VOT2024001`
- Password: `voter123`

### Test Admin Credentials
- Email: `admin@election.gov`
- Password: `admin123`

## 📈 Performance Considerations

- **Face Recognition**: Initial model loading takes 30-60 seconds
- **Connection Pooling**: Database pool of 5 connections
- **Token Expiration**: Access tokens expire after 30 minutes
- **Rate Limiting**: Implement rate limiting for production use

## 🚨 Troubleshooting

### Common Issues

1. **Face Recognition Fails**
   - Ensure good lighting conditions
   - Face directly towards camera
   - Remove glasses/masks if possible

2. **Database Connection Error**
   - Verify MySQL service is running
   - Check credentials in .env file
   - Ensure database exists

3. **TensorFlow Warnings**
   - Normal on first run
   - Models are downloaded automatically
   - Wait for initialization to complete

4. **Frontend Not Loading**
   - Check if backend is running on port 8000
   - Verify CORS settings
   - Clear browser cache

## 📝 Future Enhancements

- [ ] Mobile application (iOS/Android)
- [ ] Blockchain integration for vote storage
- [ ] Multi-language support
- [ ] SMS/Email notifications
- [ ] Advanced fraud detection algorithms
- [ ] Voter education module
- [ ] Live streaming of result announcements

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- MTCNN for face detection
- FaceNet for face recognition
- FastAPI framework
- React community
- MySQL database team

## ⚠️ Disclaimer

This is an educational project demonstrating secure voting system concepts. Production deployment requires additional security hardening, compliance checks, and regulatory approval.
