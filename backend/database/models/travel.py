from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class TravelRequest(Base):
    __tablename__ = "travel_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Request Information
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    
    # Travel Details
    purpose = Column(String(100))  # interview, onboarding, meeting
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    departure_date = Column(DateTime(timezone=True), nullable=False)
    return_date = Column(DateTime(timezone=True))
    
    # Preferences
    travel_class = Column(String(20), default="economy")  # economy, business, first
    airline_preference = Column(String(100))
    time_preference = Column(String(20))  # morning, afternoon, evening, flexible
    
    # Budget
    budget_limit = Column(Float)
    currency = Column(String(10), default="INR")
    
    # Status
    status = Column(String(50), default="pending")  # pending, approved, booked, completed, cancelled
    approval_required = Column(Boolean, default=True)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    
    # Flight Information
    selected_flight = Column(JSON)
    booking_reference = Column(String(50))
    total_cost = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by])
    candidate = relationship("Candidate")
    job = relationship("Job")
    
    def __repr__(self):
        return f"<TravelRequest(id={self.id}, origin='{self.origin}', destination='{self.destination}')>"

class FlightOption(Base):
    __tablename__ = "flight_options"
    
    id = Column(Integer, primary_key=True, index=True)
    travel_request_id = Column(Integer, ForeignKey("travel_requests.id"), nullable=False)
    
    # Flight Details
    airline = Column(String(100))
    flight_number = Column(String(20))
    departure_time = Column(DateTime(timezone=True))
    arrival_time = Column(DateTime(timezone=True))
    duration = Column(String(20))
    
    # Pricing
    price = Column(Float)
    currency = Column(String(10), default="INR")
    booking_class = Column(String(20))
    
    # Additional Information
    stops = Column(Integer, default=0)
    aircraft_type = Column(String(50))
    baggage_included = Column(Boolean, default=True)
    
    # Metadata
    source = Column(String(50))  # google_flights, airline_direct, travel_agent
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    travel_request = relationship("TravelRequest")