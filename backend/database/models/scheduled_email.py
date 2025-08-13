# database/models/scheduled_email.py
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class ScheduledEmail(Base):
    __tablename__ = "scheduled_emails"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    template_id = Column(Integer, ForeignKey("email_templates.id"))
    category = Column(String(100), nullable=False)  # interview, test, bulk, follow_up, etc.
    
    # Scheduling details
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="scheduled")  # scheduled, sent, failed, cancelled
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    
    # Recipients
    recipients = Column(JSON, default=[])  # List of recipient details
    recipient_count = Column(Integer, default=0)
    
    # Email content customization
    subject_override = Column(String(500))  # Override template subject
    variables = Column(JSON, default={})    # Template variables
    
    # Tracking
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    
    # Schedule configuration
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(JSON)  # For recurring schedules
    timezone = Column(String(50), default="Asia/Kolkata")
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    sent_at = Column(DateTime(timezone=True))
    
    # Relationships
    template = relationship("EmailTemplate", backref="scheduled_emails")

class EmailDeliveryLog(Base):
    __tablename__ = "email_delivery_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    scheduled_email_id = Column(Integer, ForeignKey("scheduled_emails.id"))
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255))
    
    status = Column(String(50), default="pending")  # pending, sent, failed, bounced
    sent_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    
    error_message = Column(Text)
    tracking_id = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    