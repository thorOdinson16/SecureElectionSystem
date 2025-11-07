# Secure Election System

A secure online voting system with facial recognition and end-to-end encryption.

## Features
- Face Recognition (MTCNN + FaceNet)
- End-to-End Vote Encryption (RSA-2048)
- Comprehensive Audit Logging
- Real-time Analytics Dashboard
- Demographic Analysis
- Security Monitoring

## Tech Stack
- **Backend**: Python, FastAPI, MySQL
- **Frontend**: React, Vite
- **Face Recognition**: MTCNN, FaceNet
- **Encryption**: RSA-2048

## Setup Instructions

### 1. Database Setup
```bash
mysql -u root -p
source database/schema.sql
source database/functions.sql
source database/procedures.sql
source database/triggers.sql
source database/sample_data.sql
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Team Members
- [Your Name]
- [Team Member 2 Name]

## Project Guide
- [Professor Name]

## Course
Database Management System (UE23CS351A)
