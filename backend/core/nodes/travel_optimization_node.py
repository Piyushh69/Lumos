from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from core.graph.state import NaviHireState
from core.tools.flight_search import GoogleFlightScraper
from core.tools.email_automation import EmailAutomation
import os
from datetime import datetime, timedelta

class TravelOptimizationNode:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.flight_scraper = GoogleFlightScraper()
        self.email_automation = EmailAutomation()
    
    def process(self, state: NaviHireState) -> NaviHireState:
        """Process travel optimization requests"""
        try:
            travel_requests = state.get("travel_requests", [])
            
            if not travel_requests:
                state["task_progress"]["travel_optimization"] = {
                    "status": "no_requests",
                    "message": "No travel requests to process"
                }
                return state
            
            optimized_travel = []
            
            for request in travel_requests:
                optimization = self._optimize_travel_request(request)
                optimized_travel.append(optimization)
            
            state["travel_requests"] = optimized_travel
            state["task_progress"]["travel_optimization"] = {
                "status": "completed",
                "optimized_requests": len(optimized_travel),
                "total_savings": self._calculate_savings(optimized_travel)
            }
            
        except Exception as e:
            state["task_progress"]["travel_optimization"] = {
                "status": "error",
                "error": str(e)
            }
        
        return state
    
    def _optimize_travel_request(self, request: dict) -> dict:
        """Optimize individual travel request"""
        try:
            origin = request.get("origin", "Delhi")
            destination = request.get("destination", "Mumbai")
            travel_date = request.get("date", (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'))
            
            # Search for flights
            flight_options = self.flight_scraper.scrape_google_flights(origin, destination, travel_date)
            
            # Find best options
            best_value = self._find_best_value_flight(flight_options)
            fastest = self._find_fastest_flight(flight_options)
            cheapest = self._find_cheapest_flight(flight_options)
            
            # Generate recommendations
            recommendations = self._generate_travel_recommendations(
                request, best_value, fastest, cheapest
            )
            
            return {
                "original_request": request,
                "flight_options": flight_options,
                "recommendations": {
                    "best_value": best_value,
                    "fastest": fastest,
                    "cheapest": cheapest
                },
                "ai_analysis": recommendations,
                "optimization_score": self._calculate_optimization_score(flight_options)
            }
            
        except Exception as e:
            return {
                "original_request": request,
                "error": str(e),
                "optimization_score": 0
            }
    
    def _find_best_value_flight(self, flights: list) -> dict:
        """Find best value flight based on price and convenience"""
        if not flights:
            return {}
        
        # Simple scoring: lower price + reasonable time = better value
        scored_flights = []
        for flight in flights:
            price = self._extract_price(flight.get("price", "0"))
            # Add scoring logic here
            score = 100 - (price / 100)  # Simplified scoring
            scored_flights.append((flight, score))
        
        return max(scored_flights, key=lambda x: x[1])[0] if scored_flights else {}
    
    def _find_fastest_flight(self, flights: list) -> dict:
        """Find fastest flight"""
        if not flights:
            return {}
        
        # Find flight with shortest duration
        fastest = min(flights, key=lambda x: len(x.get("duration", "999h")))
        return fastest
    
    def _find_cheapest_flight(self, flights: list) -> dict:
        """Find cheapest flight"""
        if not flights:
            return {}
        
        cheapest = min(flights, key=lambda x: self._extract_price(x.get("price", "999999")))
        return cheapest
    
    def _extract_price(self, price_str: str) -> float:
        """Extract numeric price from string"""
        try:
            import re
            numbers = re.findall(r'[\d,]+', price_str.replace('₹', '').replace(',', ''))
            return float(numbers[0]) if numbers else 999999
        except:
            return 999999
    
    def _generate_travel_recommendations(self, request: dict, best_value: dict, fastest: dict, cheapest: dict) -> str:
        """Generate AI-powered travel recommendations"""
        recommendation_prompt = f"""
        Generate travel recommendations for this request:
        
        Request: {request}
        Best Value Option: {best_value}
        Fastest Option: {fastest}
        Cheapest Option: {cheapest}
        
        Provide:
        1. Which option is recommended and why
        2. Cost-benefit analysis
        3. Travel policy compliance notes
        4. Alternative suggestions
        
        Be concise and actionable.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=recommendation_prompt)])
            return response.content
        except:
            return "Unable to generate recommendations at this time."
    
    def _calculate_optimization_score(self, flights: list) -> float:
        """Calculate optimization score based on available options"""
        if not flights:
            return 0
        
        # Simple scoring based on number of options and price range
        price_range = max([self._extract_price(f.get("price", "0")) for f in flights]) - \
                     min([self._extract_price(f.get("price", "0")) for f in flights])
        
        # More options and wider price range = better optimization potential
        score = min(len(flights) * 10 + (price_range / 1000), 100)
        return round(score, 1)
    
    def _calculate_savings(self, optimized_requests: list) -> dict:
        """Calculate total potential savings"""
        total_savings = 0
        currency = "INR"
        
        for request in optimized_requests:
            # Calculate savings logic here
            recommendations = request.get("recommendations", {})
            if recommendations:
                # Simplified savings calculation
                total_savings += 1000  # Mock savings
        
        return {
            "amount": total_savings,
            "currency": currency,
            "percentage": 15  # Mock percentage
        }
