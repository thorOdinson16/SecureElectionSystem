from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class Gender(str, Enum):
    M = "M"
    F = "F"
    O = "O"

class VoterRegistration(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    date_of_birth: date
    gender: Gender
    address: str = Field(..., min_length=10, max_length=500)
    constituency_id: int
    voter_id_number: str = Field(..., min_length=5, max_length=50)
    password: str = Field(..., min_length=8)

class VoterRegistrationRequest(BaseModel):
    voter: VoterRegistration
    face_image: str

class VoterLogin(BaseModel):
    voter_id_number: str
    password: str

class VoteCast(BaseModel):
    candidate_id: int
    election_id: int

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class CandidateCreate(BaseModel):
    name: str
    age: int = Field(..., ge=25)
    party_id: int
    election_id: int
    constituency_id: int
    criminal_records: Optional[str] = None

class ElectionCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime

class TokenData(BaseModel):
    user_id: int
    user_type: str
    voter_id_number: Optional[str] = None

class FaceVerificationRequest(BaseModel):
    voter_id: int
    face_image: str