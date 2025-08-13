from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from database.base import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    messages = Column(JSON, default=[])
    context = Column(Text)
    message_count = Column(Integer, default=0)
    last_message = Column(Text)
    user_id = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ChatAction(Base):
    __tablename__ = "chat_actions"
    
    id = Column(String(255), primary_key=True)
    session_id = Column(String(255), nullable=False)
    action_type = Column(String(100), nullable=False)
    action_data = Column(JSON, default={})
    status = Column(String(50), default='pending')  # pending, confirmed, executed, failed
    result = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    executed_at = Column(DateTime(timezone=True))
