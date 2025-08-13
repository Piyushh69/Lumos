from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100))
    location = Column(String(255))
    employment_type = Column(String(50))
    description = Column(Text)
    responsibilities = Column(JSON, default=[])
    required_qualifications = Column(JSON, default=[])
    preferred_qualifications = Column(JSON, default=[])
    required_skills = Column(JSON, default=[])
    preferred_skills = Column(JSON, default=[])
    experience_level = Column(String(50))
    min_experience_years = Column(Float, default=0.0)
    max_experience_years = Column(Float)
    salary_min = Column(Float)
    salary_max = Column(Float)
    currency = Column(String(10), default="INR")
    benefits = Column(JSON, default=[])
    status = Column(String(50), default="draft")
    priority = Column(String(20), default="medium")
    ai_generated = Column(Boolean, default=False)
    generation_prompt = Column(Text)
    hiring_manager_id = Column(Integer, ForeignKey("users.id"))
    recruiter_id = Column(Integer, ForeignKey("users.id"))
    positions_available = Column(Integer, default=1)
    positions_filled = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    deadline = Column(DateTime(timezone=True))