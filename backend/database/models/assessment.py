from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class TestTemplate(Base):
    __tablename__ = "test_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    duration_minutes = Column(Integer, default=60)
    total_questions = Column(Integer, default=20)
    passing_score = Column(Float, default=70.0)
    mettl_test_id = Column(String(100))
    mettl_config = Column(JSON, default={})
    instructions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ScheduledTest(Base):
    __tablename__ = "scheduled_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("test_templates.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    deadline = Column(DateTime(timezone=True))
    time_limit_minutes = Column(Integer)
    status = Column(String(50), default="scheduled")
    test_link = Column(String(500))
    access_code = Column(String(20))
    score = Column(Float)
    completion_time_minutes = Column(Integer)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    mettl_session_id = Column(String(100))
    mettl_report_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())