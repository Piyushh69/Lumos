from typing import List, Dict, Optional
from database.repositories.candidate_repo import CandidateRepository
from database.repositories.job_repo import JobRepository
from database.models.travel import TravelRequest, FlightOption
from core.tools.flight_search import GoogleFlightScraper
from core.tools.email_automation import EmailAutomation
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import re

class TravelService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.candidate_repo = CandidateRepository(db_session)
        self.job_repo = JobRepository(db_session)
        self.flight_scraper = GoogleFlightScraper()
        self.email_automation = EmailAutomation()
    
    async def create_travel_request(self, request_data: Dict) -> Dict:
        """Create a new travel request"""
        try:
            # Create travel request
            travel_request = TravelRequest(**request_data)
            self.db.add(travel_request)
            self.db.commit()
            self.db.refresh(travel_request)
            
            # Search for flight options
            flight_options = await self._search_flight_options(travel_request)
            
            # Send approval request if required
            if travel_request.approval_required and travel_request.requester:
                await self._send_approval_request(travel_request)
            
            return {
                "success": True,
                "travel_request_id": travel_request.id,
                "flight_options": flight_options,
                "status": travel_request.status
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def search_flight_options(self, travel_request_id: int) -> Dict:
        """Search flight options for a travel request"""
        try:
            travel_request = self.db.query(TravelRequest).filter(
                TravelRequest.id == travel_request_id
            ).first()
            
            if not travel_request:
                return {"success": False, "error": "Travel request not found"}
            
            flight_options = await self._search_flight_options(travel_request)
            
            return {
                "success": True,
                "travel_request_id": travel_request_id,
                "flight_options": flight_options
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _search_flight_options(self, travel_request: TravelRequest) -> List[Dict]:
        """Internal method to search flight options"""
        try:
            # Format date for flight search
            departure_date = travel_request.departure_date.strftime('%Y-%m-%d')
            
            # Search flights
            flights = self.flight_scraper.scrape_google_flights(
                travel_request.origin,
                travel_request.destination,
                departure_date,
                "round-trip" if travel_request.return_date else "one-way"
            )
            
            # Store flight options in database
            for flight in flights:
                flight_option = FlightOption(
                    travel_request_id=travel_request.id,
                    airline=flight.get("airline"),
                    flight_number=flight.get("flight_number"),
                    price=self._extract_price(flight.get("price", "0")),
                    currency="INR",
                    booking_class=travel_request.travel_class,
                    source=flight.get("source", "Unknown")
                )
                self.db.add(flight_option)
            
            self.db.commit()
            
            # Add recommendations
            enhanced_flights = self._add_flight_recommendations(flights, travel_request)
            
            return enhanced_flights
            
        except Exception as e:
            print(f"Flight search error: {e}")
            return []
    
    def _add_flight_recommendations(self, flights: List[Dict], 
                                  travel_request: TravelRequest) -> List[Dict]:
        """Add recommendations to flight options"""
        if not flights:
            return flights
        
        # Sort flights by price
        flights_with_price = []
        for flight in flights:
            price = self._extract_price(flight.get("price", "999999"))
            flight["price_numeric"] = price
            flights_with_price.append(flight)
        
        flights_with_price.sort(key=lambda x: x["price_numeric"])
        
        # Add recommendations
        for i, flight in enumerate(flights_with_price):
            if i == 0:
                flight["recommendation"] = "Cheapest Option"
            elif "duration" in flight and "1h" in flight["duration"]:
                flight["recommendation"] = "Fastest Option"
            elif travel_request.budget_limit and flight["price_numeric"] <= travel_request.budget_limit:
                flight["recommendation"] = "Within Budget"
            else:
                flight["recommendation"] = "Standard Option"
        
        return flights_with_price
    
    def approve_travel_request(self, travel_request_id: int, approver_id: int) -> Dict:
        """Approve a travel request"""
        try:
            travel_request = self.db.query(TravelRequest).filter(
                TravelRequest.id == travel_request_id
            ).first()
            
            if not travel_request:
                return {"success": False, "error": "Travel request not found"}
            
            # Update request status
            travel_request.status = "approved"
            travel_request.approved_by = approver_id
            travel_request.approved_at = datetime.utcnow()
            self.db.commit()
            
            # Send approval notification
            if travel_request.requester:
                self._send_approval_notification(travel_request)
            
            return {
                "success": True,
                "status": "approved",
                "approved_at": travel_request.approved_at.isoformat()
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def reject_travel_request(self, travel_request_id: int, approver_id: int, reason: str = "") -> Dict:
        """Reject a travel request"""
        try:
            travel_request = self.db.query(TravelRequest).filter(
                TravelRequest.id == travel_request_id
            ).first()
            
            if not travel_request:
                return {"success": False, "error": "Travel request not found"}
            
            # Update request status
            travel_request.status = "rejected"
            travel_request.approved_by = approver_id
            travel_request.approved_at = datetime.utcnow()
            self.db.commit()
            
            # Send rejection notification
            if travel_request.requester:
                self._send_rejection_notification(travel_request, reason)
            
            return {
                "success": True,
                "status": "rejected",
                "reason": reason
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def book_flight(self, travel_request_id: int, flight_option_id: int) -> Dict:
        """Book a selected flight option"""
        try:
            travel_request = self.db.query(TravelRequest).filter(
                TravelRequest.id == travel_request_id
            ).first()
            
            flight_option = self.db.query(FlightOption).filter(
                FlightOption.id == flight_option_id
            ).first()
            
            if not travel_request or not flight_option:
                return {"success": False, "error": "Travel request or flight option not found"}
            
            # Update travel request with selected flight
            travel_request.selected_flight = {
                "airline": flight_option.airline,
                "flight_number": flight_option.flight_number,
                "price": flight_option.price,
                "booking_class": flight_option.booking_class
            }
            travel_request.total_cost = flight_option.price
            travel_request.status = "booked"
            travel_request.booking_reference = f"NVH{travel_request_id}{flight_option_id}"
            
            self.db.commit()
            
            # Send booking confirmation
            if travel_request.requester:
                self._send_booking_confirmation(travel_request)
            
            return {
                "success": True,
                "booking_reference": travel_request.booking_reference,
                "total_cost": travel_request.total_cost,
                "status": "booked"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_travel_requests(self, user_id: int = None, status: str = None) -> List[Dict]:
        """Get travel requests with optional filters"""
        try:
            query = self.db.query(TravelRequest)
            
            if user_id:
                query = query.filter(TravelRequest.requester_id == user_id)
            
            if status:
                query = query.filter(TravelRequest.status == status)
            
            travel_requests = query.order_by(TravelRequest.created_at.desc()).all()
            
            return [self._travel_request_to_dict(tr) for tr in travel_requests]
            
        except Exception as e:
            print(f"Error getting travel requests: {e}")
            return []
    
    def get_travel_statistics(self) -> Dict:
        """Get travel statistics for dashboard"""
        try:
            total_requests = self.db.query(TravelRequest).count()
            pending_requests = self.db.query(TravelRequest).filter(
                TravelRequest.status == "pending"
            ).count()
            approved_requests = self.db.query(TravelRequest).filter(
                TravelRequest.status == "approved"
            ).count()
            booked_requests = self.db.query(TravelRequest).filter(
                TravelRequest.status == "booked"
            ).count()
            
            # Calculate total travel cost
            booked_travel_requests = self.db.query(TravelRequest).filter(
                TravelRequest.status == "booked"
            ).all()
            total_cost = sum([tr.total_cost or 0 for tr in booked_travel_requests])
            
            # Recent requests (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_requests = self.db.query(TravelRequest).filter(
                TravelRequest.created_at >= thirty_days_ago
            ).count()
            
            return {
                "total_requests": total_requests,
                "pending_requests": pending_requests,
                "approved_requests": approved_requests,
                "booked_requests": booked_requests,
                "total_travel_cost": total_cost,
                "recent_requests": recent_requests,
                "approval_rate": (approved_requests / total_requests * 100) if total_requests > 0 else 0
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _send_approval_request(self, travel_request: TravelRequest):
        """Send approval request email"""
        try:
            # Get approver email (this would be configured based on company hierarchy)
            approver_email = "hr-manager@company.com"  # This should be dynamic
            
            travel_details = {
                "purpose": travel_request.purpose,
                "origin": travel_request.origin,
                "destination": travel_request.destination,
                "departure_date": travel_request.departure_date.strftime('%Y-%m-%d'),
                "return_date": travel_request.return_date.strftime('%Y-%m-%d') if travel_request.return_date else None,
                "estimated_cost": travel_request.budget_limit
            }
            
            self.email_automation.send_travel_approval_request(
                approver_email,
                travel_request.requester.full_name if travel_request.requester else "Unknown",
                travel_details
            )
            
        except Exception as e:
            print(f"Error sending approval request: {e}")
    
    def _send_approval_notification(self, travel_request: TravelRequest):
        """Send approval notification email"""
        try:
            if travel_request.requester and travel_request.requester.email:
                # Send approval email (implement email template)
                pass
        except Exception as e:
            print(f"Error sending approval notification: {e}")
    
    def _send_rejection_notification(self, travel_request: TravelRequest, reason: str):
        """Send rejection notification email"""
        try:
            if travel_request.requester and travel_request.requester.email:
                # Send rejection email (implement email template)
                pass
        except Exception as e:
            print(f"Error sending rejection notification: {e}")
    
    def _send_booking_confirmation(self, travel_request: TravelRequest):
        """Send booking confirmation email"""
        try:
            if travel_request.requester and travel_request.requester.email:
                # Send booking confirmation email (implement email template)
                pass
        except Exception as e:
            print(f"Error sending booking confirmation: {e}")
    
    def _extract_price(self, price_str: str) -> float:
        """Extract numeric price from string"""
        try:
            numbers = re.findall(r'[\d,]+', price_str.replace('₹', '').replace(',', ''))
            return float(numbers[0]) if numbers else 0.0
        except:
            return 0.0
    
    def _travel_request_to_dict(self, travel_request: TravelRequest) -> Dict:
        """Convert travel request object to dictionary"""
        return {
            "id": travel_request.id,
            "purpose": travel_request.purpose,
            "origin": travel_request.origin,
            "destination": travel_request.destination,
            "departure_date": travel_request.departure_date.isoformat() if travel_request.departure_date else None,
            "return_date": travel_request.return_date.isoformat() if travel_request.return_date else None,
            "status": travel_request.status,
            "total_cost": travel_request.total_cost,
            "booking_reference": travel_request.booking_reference,
            "created_at": travel_request.created_at.isoformat() if travel_request.created_at else None,
            "approved_at": travel_request.approved_at.isoformat() if travel_request.approved_at else None
        }