from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20))
    location = Column(String(255))
    resume_filename = Column(String(500))
    resume_url = Column(String(1000))
    resume_text = Column(Text)
    skills = Column(JSON, default=[])
    experience_years = Column(Float, default=0.0)
    education = Column(JSON, default=[])
    certifications = Column(JSON, default=[])
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    status = Column(String(50), default="new")
    is_available = Column(Boolean, default=True)
    source = Column(String(100))
    source_details = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_contacted = Column(DateTime(timezone=True))

class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    application_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="applied")
    match_score = Column(Float, default=0.0)
    strengths = Column(JSON, default=[])
    gaps = Column(JSON, default=[])
    recommendation = Column(Text)
    interview_scheduled = Column(DateTime(timezone=True))
    interview_feedback = Column(Text)
    interview_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())