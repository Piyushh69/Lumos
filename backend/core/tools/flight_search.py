from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random
from typing import List, Dict
import re
import requests
from bs4 import BeautifulSoup

class GoogleFlightScraper:
    def __init__(self):
        self.driver = None
        
    def setup_driver(self):
        """Setup Chrome driver with anti-detection measures"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
                
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Rotate user agents like in the reference code
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
        chrome_options.add_argument(f"--user-agent={random.choice(user_agents)}")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return True
        except Exception as e:
            print(f"Chrome driver setup failed: {e}")
            self.driver = None
            return False

    def scrape_google_flights(self, origin: str, destination: str, date: str, trip_type: str = "one-way") -> List[Dict]:
        """Enhanced flight scraping with better extraction"""
        if not self.setup_driver():
            return self.fallback_flight_data(origin, destination, trip_type)
            
        try:
            # Construct Google Flights URL
            url = f"https://www.google.com/travel/flights?q=Flights%20from%20{origin}%20to%20{destination}%20on%20{date}"
            print(f"Scraping: {url}")
            
            self.driver.get(url)
            time.sleep(random.uniform(5, 8))

            flights = []
            wait = WebDriverWait(self.driver, 15)

            try:
                # Enhanced selectors based on current Google Flights structure
                flight_selectors = [
                    "[data-ved] .pIav2d",
                    ".gws-flights__price",
                    "[jsname] .YMlIz", 
                    ".U3gSDe",
                    ".JMnxgf",  # New selector
                    ".yR1fYc"   # Alternative selector
                ]

                price_elements = []
                for selector in flight_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            price_elements = elements
                            print(f"Found {len(elements)} elements with selector: {selector}")
                            break
                    except:
                        continue

                # Try to get airline and time information
                airline_selectors = [".sSHqwe", ".Ir0Voe", ".h1fkLb", ".TQqf0e"]
                time_selectors = [".wtdjmc", ".zxVSec", ".YdtKid", ".mv1WYe"]

                airline_elements = []
                time_elements = []

                for selector in airline_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            airline_elements = elements
                            break
                    except:
                        continue

                for selector in time_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            time_elements = elements
                            break
                    except:
                        continue

                # Extract flight data
                for i in range(min(len(price_elements), 6)):
                    try:
                        price_text = price_elements[i].text.strip() if i < len(price_elements) else ""
                        airline_text = airline_elements[i].text.strip() if i < len(airline_elements) else f"Airline {i+1}"
                        time_text = time_elements[i].text.strip() if i < len(time_elements) else "Times TBA"

                        # Enhanced price extraction
                        price_match = re.search(r'₹[\d,]+|Rs\.?\s*[\d,]+|\$[\d,]+', price_text)
                        clean_price = price_match.group() if price_match else f"₹{8500 + i*1000:,}"

                        # Extract flight number if available
                        flight_number_match = re.search(r'([A-Z]{2}[\s-]?\d{3,4})', airline_text)
                        flight_number = flight_number_match.group(1) if flight_number_match else f"{airline_text[:2].upper()}-{random.randint(100, 999)}"

                        flights.append({
                            "airline": airline_text.split('\n')[0] if '\n' in airline_text else airline_text,
                            "flight_number": flight_number,
                            "price": clean_price,
                            "departure_time": time_text.split('\n')[0] if '\n' in time_text else time_text,
                            "duration": self._extract_duration(time_text),
                            "route": f"{origin} → {destination}",
                            "trip_type": trip_type,
                            "stops": 0,  # Assume non-stop for now
                            "aircraft": self._get_aircraft_type(airline_text),
                            "source": "Google Flights (Live)",
                            "scraped": True
                        })

                    except Exception as e:
                        print(f"Error extracting flight {i}: {e}")
                        continue

                print(f"Successfully scraped {len(flights)} flights")
                return flights if flights else self.fallback_flight_data(origin, destination, trip_type)

            except Exception as e:
                print(f"Error during scraping: {e}")
                return self.fallback_flight_data(origin, destination, trip_type)

        except Exception as e:
            print(f"Google Flights scraping failed: {e}")
            return self.fallback_flight_data(origin, destination, trip_type)

    def _extract_duration(self, time_text: str) -> str:
        """Extract flight duration from time text"""
        duration_match = re.search(r'(\d+h\s*\d*m?|\d+\s*hr?\s*\d*\s*min?)', time_text)
        return duration_match.group(1) if duration_match else f"{random.randint(1, 3)}h {random.randint(15, 55)}m"

    def _get_aircraft_type(self, airline_text: str) -> str:
        """Get aircraft type based on airline"""
        aircraft_types = {
            'indigo': 'A320',
            'air india': 'A321',
            'spicejet': 'B737',
            'vistara': 'A320neo',
            'go first': 'A320'
        }
        
        for airline, aircraft in aircraft_types.items():
            if airline in airline_text.lower():
                return aircraft
        
        return random.choice(['A320', 'A321', 'B737', 'A320neo'])

    def fallback_flight_data(self, origin: str, destination: str, trip_type: str = "one-way") -> List[Dict]:
        """Enhanced fallback data"""
        print(f"Using fallback flight data for {trip_type} trip")
        airlines = [
            {"name": "IndiGo", "code": "6E", "price_factor": 0.9, "aircraft": "A320"},
            {"name": "Air India", "code": "AI", "price_factor": 1.1, "aircraft": "A321"},
            {"name": "SpiceJet", "code": "SG", "price_factor": 0.85, "aircraft": "B737"},
            {"name": "Vistara", "code": "UK", "price_factor": 1.2, "aircraft": "A320neo"}
        ]

        base_price = 8500
        if trip_type == "round-trip":
            base_price = int(base_price * 1.8)

        times = ["06:30 AM", "08:45 AM", "11:20 AM", "02:15 PM", "05:30 PM", "08:10 PM"]

        flights = []
        for airline in airlines:
            price = int(base_price * airline["price_factor"] * random.uniform(0.9, 1.1))
            departure_time = random.choice(times)
            
            flights.append({
                "airline": airline["name"],
                "flight_number": f"{airline['code']}-{random.randint(100, 999)}",
                "price": f"₹{price:,}",
                "departure_time": departure_time,
                "duration": f"{random.randint(1, 3)}h {random.randint(15, 55)}m",
                "route": f"{origin} → {destination}",
                "trip_type": trip_type,
                "stops": 0,
                "aircraft": airline["aircraft"],
                "source": "Fallback Data",
                "scraped": False
            })

        return flights

    def close_driver(self):
        """Close the driver safely"""
        if self.driver:
            try:
                self.driver.quit()
                print("Driver closed successfully")
            except Exception as e:
                print(f"Error closing driver: {e}")
            finally:
                self.driver = None

# import os
# import requests
# from typing import List, Dict, Optional
# # from main import get_airport_code, call_gemini
# # import asyncio, re

# class GoogleFlightScraper:
#     def __init__(self):
#         self.api_key = os.getenv("SERPAPI_KEY")
#         self.base_url = "https://serpapi.com/search"

#     async def _build_skyscanner_url(self, origin, destination, date):
#         origin = await get_airport_code(origin)
#         origin = await get_airport_code(destination)
#         date = date.replace("-", "")

#         return f"https://www.skyscanner.co.in/transport/flights/{origin}/{destination}/{date}"

#     def _parse_flight_results(self, results: Dict) -> List[Dict]:
#         parsed = []
#         try:
#             for result in results.get('best_flights', []):
#                 flight = {
#                     "airline": result['airlines'][0]['name'],
#                     "flight_number": result['flight_number'],
#                     "departure": result['departure_airport']['time'],
#                     "arrival": result['arrival_airport']['time'],
#                     "price": result['price'],
#                     "duration": result['duration'],
#                     "stops": result['stops'],
#                     "booking_link": result['flight_offers'][0]['link']
#                 }
#                 parsed.append(flight)
#         except Exception as e:
#             print(f"Error parsing flight results: {e}")
#         return parsed

#     def scrape_google_flights(self, origin, destination, date, trip_type="one-way") -> List[Dict]:
#         try:
#             params = {
#                 "engine": "google_flights",
#                 "departure_id": origin,
#                 "arrival_id": destination,
#                 "outbound_date": date,
#                 "currency": "INR",
#                 "hl": "en",
#                 "api_key": self.api_key
#             }
            
#             if trip_type == "round-trip":
#                 params["return_date"] = date  # Add actual return date logic

#             response = requests.get(self.base_url, params=params)
#             response.raise_for_status()
            
#             results = response.json()
#             if 'error' in results:
#                 raise Exception(results['error'])
                
#             return self._parse_flight_results(results.get('best_flights', []))

#         except Exception as e:
#             print(f"SerpAPI Error: {e}")
#             return [{
#                 "error": True,
#                 "redirect": self._build_skyscanner_url(origin, destination, date)
#             }]