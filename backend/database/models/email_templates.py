from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text)
    variables = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    is_system_template = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmailSignature(Base):
    __tablename__ = "email_signatures"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    html_content = Column(Text, nullable=False)
    company_logo_url = Column(String(500))
    company_name = Column(String(255))
    company_website = Column(String(255))
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmailAddon(Base):
    __tablename__ = "email_addons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    auto_include = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmailCampaign(Base):
    __tablename__ = "email_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    template_id = Column(Integer, ForeignKey("email_templates.id"))
    sender_name = Column(String(255))
    sender_email = Column(String(255))
    recipient_type = Column(String(50))
    recipient_data = Column(JSON)
    send_immediately = Column(Boolean, default=True)
    scheduled_at = Column(DateTime(timezone=True))
    status = Column(String(50), default="draft")
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    open_rate = Column(Float, default=0.0)
    click_rate = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True))