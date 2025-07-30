# from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
# from fastapi.staticfiles import StaticFiles
# from fastapi.middleware.cors import CORSMiddleware
# import json
# import uuid
# from core.agents.supervisor import NaviHireSupervisor
# from core.graph.state import NaviHireState
# from langchain_core.messages import HumanMessage
# from typing import List
# import os
# from fastapi.responses import FileResponse
# from pathlib import Path

# app = FastAPI(
#     title="NaviHire - AI-Powered Talent & Travel Intelligence",
#     description="Revolutionizing HR and Corporate Travel with AI",
#     version="1.0.0"
# )

# app.add_middleware(
#    CORSMiddleware,
#    allow_origins=["*"],  # Allow all origins
#    allow_credentials=True,
#    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
#    allow_headers=["*"],  # Allow all headers
# )

# # Mount frontend
# try:
#     app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")
# except:
#     print("Frontend build not found")

# # Initialize supervisor
# supervisor = NaviHireSupervisor()

# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: dict = {}
    
#     async def connect(self, websocket: WebSocket, user_id: str):
#         await websocket.accept()
#         self.active_connections[user_id] = websocket
    
#     def disconnect(self, user_id: str):
#         if user_id in self.active_connections:
#             del self.active_connections[user_id]

# manager = ConnectionManager()

# @app.get("/")
# async def root():
#     return FileResponse(Path(__file__).parent.parent / "frontend" / "public" / "index.html")

# @app.post("/api/v1/resumes/upload")
# async def upload_resumes(files: List[UploadFile] = File(...), job_id: str = Form(...)):
#     """Upload and process resumes"""
#     uploaded_resumes = []
    
#     for file in files:
#         content = await file.read()
#         uploaded_resumes.append({
#             "filename": file.filename,
#             "content": content,
#             "size": len(content)
#         })
    
#     # Process with supervisor
#     state = NaviHireState(
#         messages=[HumanMessage(content=f"Process {len(files)} resumes for job {job_id}")],
#         user_id="api_user",
#         session_id=str(uuid.uuid4()),
#         user_role="hr_manager",
#         current_job_id=job_id,
#         uploaded_resumes=uploaded_resumes,
#         candidate_matches=[],
#         job_description=None,
#         travel_requests=[],
#         flight_results=None,
#         travel_policy=None,
#         current_task="resume_analysis",
#         next_action="resume_analysis",
#         task_progress={},
#         hr_metrics={},
#         travel_metrics={},
#         conversation_history=[],
#         user_preferences={}
#     )
    
#     result = supervisor.graph.invoke(state)
    
#     return {
#         "status": "success",
#         "processed_resumes": len(files),
#         "analysis_results": result.get("task_progress", {}).get("resume_analysis", {}),
#         "message": "Resumes processed successfully"
#     }

# @app.get("/{full_path:path}")
# async def serve_frontend(full_path: str):
#     # Correct path to your React build directory
#     frontend_path = Path(__file__).parent.parent / "frontend" / "build"
#     index_file = frontend_path / "index.html"
    
#     if index_file.exists():
#         return FileResponse(index_file)
    
#     return {"error": "Frontend build not found"}


# @app.websocket("/ws/chat/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await manager.connect(websocket, user_id)
    
#     # Send welcome message
#     await websocket.send_text(json.dumps({
#         "type": "message",
#         "content": "Welcome to NaviHire! I can help you with resume analysis, candidate matching, and travel optimization. How can I assist you today?",
#         "agent": "system"
#     }))
    
#     try:
#         while True:
#             data = await websocket.receive_text()
#             message_data = json.loads(data)
#             user_message = message_data.get("message", "")
            
#             if not user_message.strip():
#                 continue
            
#             # Create state
#             state = NaviHireState(
#                 messages=[HumanMessage(content=user_message)],
#                 user_id=user_id,
#                 session_id=str(uuid.uuid4()),
#                 user_role="hr_manager",
#                 current_job_id=None,
#                 uploaded_resumes=[],
#                 candidate_matches=[],
#                 job_description=None,
#                 travel_requests=[],
#                 flight_results=None,
#                 travel_policy=None,
#                 current_task=None,
#                 next_action=None,
#                 task_progress={},
#                 hr_metrics={},
#                 travel_metrics={},
#                 conversation_history=[],
#                 user_preferences={}
#             )
            
#             # Process with supervisor
#             result = supervisor.graph.invoke(state)
            
#             # Send response
#             response = result["messages"][-1].content
#             await websocket.send_text(json.dumps({
#                 "type": "message",
#                 "content": response,
#                 "agent": result.get("current_task", "general"),
#                 "task_progress": result.get("task_progress", {})
#             }))
            
#     except WebSocketDisconnect:
#         manager.disconnect(user_id)

# @app.post("/api/v1/flights/search")
# async def search_flights(request: dict):
#     try:
#         origin = request.get("origin")
#         destination = request.get("destination") 
#         date = request.get("date")
        
#         # Call SerpAPI from backend (no CORS issues)
#         import requests
        
#         serpapi_params = {
#             "engine": "google_flights",
#             "departure_id": get_airport_code(origin),
#             "arrival_id": get_airport_code(destination), 
#             "outbound_date": date,
#             "currency": "INR",
#             "hl": "en",
#             "api_key": "0a9b0abe47e6107ce612664a0e582e40fc7cc91bdd1b42181cd56b2073c83fa0"
#         }
        
#         response = requests.get("https://serpapi.com/search", params=serpapi_params, timeout=10)
        
#         if response.status_code == 200:
#             data = response.json()
#             if data.get("best_flights"):
#                 # Format the results
#                 formatted_flights = []
#                 for flight in data["best_flights"]:
#                     formatted_flights.append({
#                         "id": f"serp_{len(formatted_flights)}",
#                         "airline": flight["flights"][0]["airline"],
#                         "price": f"₹{flight['price']:,}",
#                         "departure_time": flight["flights"][0]["departure_airport"]["time"],
#                         "arrival_time": flight["flights"][0]["arrival_airport"]["time"],
#                         "duration": flight["total_duration"],
#                         "stops": len(flight["flights"]) - 1,
#                         "bookingUrl": f"https://www.google.com/travel/flights",
#                         "source": "serpapi"
#                     })
                
#                 return {"success": True, "flight_results": formatted_flights}
        
#         return {"success": False, "error": "No flights found"}
        
#     except Exception as e:
#         return {"success": False, "error": str(e)}

# def get_airport_code(city_name: str) -> str:
#     codes = {
#         "mumbai": "BOM", "delhi": "DEL", "bangalore": "BLR", 
#         "bengaluru": "BLR", "chennai": "MAA", "hyderabad": "HYD"
#     }
#     return codes.get(city_name.lower(), city_name.upper()[:3])

# if __name__ == "__main__":
#     import uvicorn
#     print("Starting NaviHire - AI-Powered Talent & Travel Intelligence Platform")
#     print("Dashboard: http://localhost:8000")
#     print("API Docs: http://localhost:8000/docs")
#     uvicorn.run(app, host="0.0.0.0", port=8000)

from services import help_bot_service
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from config.database import get_database_session, close_database_session, engine, Base
from services.email_automation_service import EmailAutomationService
from services.test_scheduler_service import TestSchedulerService
from database.models.user import User
from database.models.email_templates import EmailTemplate, EmailSignature, EmailAddon, EmailCampaign
from database.models.candidate import Candidate, JobApplication 
from database.models.job import Job
from database.models.assessment import TestTemplate, ScheduledTest
from services.hr_service import HRService
import json
import uuid
from core.agents.supervisor import NaviHireSupervisor
from core.graph.state import NaviHireState
from langchain_core.messages import HumanMessage
from typing import List
import os
from pathlib import Path
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import serpapi
import asyncio, re
import google.generativeai as genai
from datetime import datetime
from services.auth_service import AuthService
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


app = FastAPI(
    title="NaviHire - AI-Powered Talent & Travel Intelligence",
    description="Revolutionizing HR and Corporate Travel with AI",
    version="1.0.0"
)

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def get_db():
    db = get_database_session()
    try:
        yield db
    finally:
        close_database_session(db)

# Mount frontend static files
frontend_build_path = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_build_path / "static")), name="static")
    print(f"✅ Frontend build found at: {frontend_build_path}")
else:
    print(f"⚠️  Frontend build not found at: {frontend_build_path}")

# Initialize supervisor with error handling
try:
    supervisor = NaviHireSupervisor()
    print("✅ NaviHire Supervisor initialized successfully")
except Exception as e:
    print(f"❌ Error initializing supervisor: {e}")
    supervisor = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        
        print("**** Creating Database tables")
        Base.metadata.create_all(bind=engine)
        
        db = get_database_session()
        try:
            existing_user = db.query(User).filter(User.username == "admin").first()
            if not existing_user:
                admin_user = User(
                    username="admin",
                    email="admin@navikenz.com",
                    full_name="NaviHire Administrator",
                    password_hash="hashed_password_12345",  # Use proper password hashing
                    role="admin",
                    department="IT",
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                print("✅ Default admin user created")
        finally:
            close_database_session(db)
        
        print("✅ Database initialization completed successfully")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "NaviHire API is running",
        "supervisor_status": "initialized" if supervisor else "error",
        "frontend_build": "found" if frontend_build_path.exists() else "missing",
        "timestamp": datetime.now().isoformat()
    }

# Email Automation Routes 

@app.post("/api/v1/emails/templates")
async def create_email_template(template_data: dict, db: Session = Depends(get_db)):
    """Create email template"""
    try:
        email_service = EmailAutomationService(db)
        
        # Set default created_by if not provided
        if "created_by" not in template_data:
            # Get the admin user ID
            admin_user = db.query(User).filter(User.username == "admin").first()
            template_data["created_by"] = admin_user.id if admin_user else 1
        
        result = email_service.create_email_template(template_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/emails/templates")
async def get_email_templates(category: str = None, db: Session = Depends(get_db)):
    """Get email templates"""
    try:
        email_service = EmailAutomationService(db)
        templates = email_service.get_email_templates(category)
        return {"success": True, "templates": templates}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/emails/send")
async def send_single_email(email_data: dict, db: Session = Depends(get_db)):
    """Send single email"""
    try:
        email_service = EmailAutomationService(db)
        result = email_service.send_single_email(email_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/emails/send-bulk")
async def send_bulk_email(campaign_data: dict, db: Session = Depends(get_db)):
    """Send bulk email campaign"""
    try:
        email_service = EmailAutomationService(db)
        result = email_service.send_bulk_email(campaign_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/emails/signatures")
async def create_email_signature(signature_data: dict, db: Session = Depends(get_db)):
    """Create email signature"""
    try:
        email_service = EmailAutomationService(db)
        result = email_service.create_email_signature(signature_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/emails/signatures")
async def get_email_signatures(db: Session = Depends(get_db)):
    """Get email signatures"""
    try:
        email_service = EmailAutomationService(db)
        signatures = email_service.get_email_signatures()
        return {"success": True, "signatures": signatures}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/emails/addons")
async def create_email_addon(addon_data: dict, db: Session = Depends(get_db)):
    """Create email addon"""
    try:
        email_service = EmailAutomationService(db)
        result = email_service.create_email_addon(addon_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/emails/addons")
async def get_email_addons(db: Session = Depends(get_db)):
    """Get email addons"""
    try:
        email_service = EmailAutomationService(db)
        addons = email_service.get_email_addons()
        return {"success": True, "addons": addons}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
# Test Scheduler Routes
@app.post("/api/v1/resumes/test-upload")
async def test_resume_upload():
    """Test endpoint to verify resume upload functionality"""
    try:
        # Test with dummy data
        test_resumes = [
            {
                "filename": "test_resume.txt",
                "content": b"John Doe\njohn.doe@email.com\n+91 9876543210\nPython, JavaScript, React\n5 years experience",
                "size": 100,
                "content_type": "text/plain"
            }
        ]
        
        from config.database import get_database_session
        from services.hr_service import HRService
        
        db = get_database_session()
        hr_service = HRService(db)
        
        result = await hr_service.process_resume_batch(test_resumes)
        
        return {
            "success": True,
            "test_result": result,
            "message": "Resume processing test completed"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Resume processing test failed"
        }

@app.post("/api/v1/emails/test")
async def test_email_service(test_data: dict, db: Session = Depends(get_db)):
    """Test email service configuration"""
    try:
        from core.tools.email_automation import EmailAutomation
        
        email_service = EmailAutomation()
        
        # Test SMTP connection first
        if not email_service.test_smtp_connection():
            return {"success": False, "error": "SMTP connection failed"}
        
        # Send test email
        test_email = test_data.get("email", "test@example.com")
        success = email_service.send_email(
            [test_email],
            "NaviHire Email Test",
            """
            <html>
            <body>
                <h2>Email Test Successful!</h2>
                <p>This is a test email from NaviHire platform.</p>
                <p>If you received this, your email configuration is working correctly.</p>
            </body>
            </html>
            """
        )
        
        return {
            "success": success,
            "message": "Test email sent" if success else "Test email failed"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/v1/tests/templates")
async def create_test_template(template_data: dict, db: Session = Depends(get_db)):
    """Create test template"""
    try:
        test_service = TestSchedulerService(db)
        result = test_service.create_test_template(template_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/tests/templates")
async def get_test_templates(db: Session = Depends(get_db)):
    """Get test templates"""
    try:
        test_service = TestSchedulerService(db)
        templates = test_service.get_test_templates()
        return {"success": True, "templates": templates}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/tests/schedule")
async def schedule_test(schedule_data: dict, db: Session = Depends(get_db)):
    """Schedule test for candidates"""
    try:
        test_service = TestSchedulerService(db)
        result = test_service.schedule_test(schedule_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/tests/scheduled")
async def get_scheduled_tests(candidate_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """Get scheduled tests"""
    try:
        test_service = TestSchedulerService(db)
        tests = test_service.get_scheduled_tests(candidate_id, status)
        return {"success": True, "tests": tests}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(content={"message": "OK"})

@app.post("/api/v1/flights/search")
async def search_flights(request: dict):
    """Enhanced flight search with better error handling"""
    try:
        origin = request.get("origin")
        destination = request.get("destination") 
        date = request.get("date")
        flight_type = request.get("flight_type")
        
        if not all([origin, destination, date]):
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: origin, destination, date"
            )
        
        print(f"🔍 Searching flights: {origin} → {destination} on {date}")
        
        # Create session with retry strategy
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        departure_code = await get_airport_code(origin)
        arrival_code = await get_airport_code(destination)

        serpapi_params = {
            "engine": "google_flights",
            "departure_id": departure_code,
            "arrival_id": arrival_code, 
            "outbound_date": date,
            "currency": "INR",
            "hl": "en",
            "type": flight_type,
            "api_key": "0a9b0abe47e6107ce612664a0e582e40fc7cc91bdd1b42181cd56b2073c83fa0"
        }
        
        print(f"📡 Making SerpAPI request with params: {serpapi_params}")
    
        response = session.get(
            "https://serpapi.com/search", 
            params=serpapi_params, 
            timeout=30,
            headers={
                'User-Agent': 'NaviHire/1.0',
                'Accept': 'application/json'
            }
        )

        search = serpapi.search(serpapi_params)
        # results = search.get_dict()
        print("this is the response got from serpapi call: \n",search)
        
        print(f"📨 SerpAPI Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "error" in data:
                print(f"❌ SerpAPI Error: {data['error']}")
                return {
                    "success": True,
                    "flight_results": fallback_flights,
                    "note": f"Using fallback data - SerpAPI error: {data['error']}"
                }
            
            if data.get("best_flights"):
                formatted_flights = []
                for i, flight in enumerate(data["best_flights"]):
                    try:
                        formatted_flights.append({
                            "id": f"serp_{i}",
                            "airline": flight["flights"][0].get("airline", "Unknown"),
                            "price": f"₹{flight.get('price', 0):,}",
                            "departure_time": flight["flights"][0]["departure_airport"].get("time", "N/A"),
                            "arrival_time": flight["flights"][0]["arrival_airport"].get("time", "N/A"),
                            "duration": flight.get("total_duration", "N/A"),
                            "stops": len(flight["flights"]) - 1,
                            "bookingUrl": "https://www.google.com/travel/flights",
                            "source": "serpapi"
                        })
                    except (KeyError, IndexError) as e:
                        print(f"⚠️  Error processing flight {i}: {e}")
                        continue
                
                print(f"✅ Found {len(formatted_flights)} flights")
                return {
                    "success": True, 
                    "flight_results": formatted_flights,
                    "total_results": len(formatted_flights)
                }
            elif data.get("other_flights"):
                formatted_flights = []
                for i, flight in enumerate(data["other_flights"]):
                    try:
                        formatted_flights.append({
                            "id": f"serp_{i}",
                            "airline": flight["flights"][0].get("airline", "Unknown"),
                            "price": f"₹{flight.get('price', 0):,}",
                            "departure_time": flight["flights"][0]["departure_airport"].get("time", "N/A"),
                            "arrival_time": flight["flights"][0]["arrival_airport"].get("time", "N/A"),
                            "duration": flight.get("total_duration", "N/A"),
                            "stops": len(flight["flights"]) - 1,
                            "bookingUrl": "https://www.google.com/travel/flights",
                            "source": "serpapi"
                        })
                    except (KeyError, IndexError) as e:
                        print(f"⚠️  Error processing flight {i}: {e}")
                        continue
                
                print(f"✅ Found {len(formatted_flights)} flights")
                return {
                    "success": True, 
                    "flight_results": formatted_flights,
                    "total_results": len(formatted_flights)
                }
            else:
                print("⚠️  No flights found in SerpAPI response")
                # Return fallback data
                fallback_flights = get_fallback_flights(origin, destination)
                return {
                    "success": True,
                    "flight_results": fallback_flights,
                    "total_results": len(fallback_flights),
                    "note": "Using fallback data - no flights found via SerpAPI"
                }
        else:
            print(f"❌ SerpAPI request failed with status {response.status_code}")
            fallback_flights = get_fallback_flights(origin, destination)
            return {
                "success": True,
                "flight_results": fallback_flights,
                "total_results": len(fallback_flights),
                "note": f"Using fallback data - SerpAPI returned {response.status_code}"
            }
        
    except requests.exceptions.Timeout:
        print("⏱️  Request timeout")
        fallback_flights = get_fallback_flights(origin, destination)
        return {
            "success": True,
            "flight_results": fallback_flights,
            "note": "Using fallback data - request timeout"
        }
    except requests.exceptions.RequestException as e:
        print(f"🌐 Network error: {str(e)}")
        fallback_flights = get_fallback_flights(origin, destination)
        return {
            "success": True,
            "flight_results": fallback_flights,
            "note": f"Using fallback data - network error: {str(e)}"
        }
    except Exception as e:
        print(f"💥 Unexpected error: {str(e)}")
        fallback_flights = get_fallback_flights(origin, destination)
        return {
            "success": True,
            "flight_results": fallback_flights,
            "note": f"Using fallback data - unexpected error: {str(e)}"
        }

@app.post("/api/v1/help-bot/chat")
async def help_bot_chat(request: dict):
    """Handle help bot chat requests"""
    try:
        message = request.get("message", "")
        context = request.get("context", {})
        
        if not message.strip():
            return {
                "response": "How can I help you with NaviHire today?",
                "actions": []
            }
        
        result = help_bot_service.process_help_request(message, context)
        return result
        
    except Exception as e:
        return {
            "response": "I apologize, but I encountered an error. Please try again.",
            "actions": []
        }

# def get_airport_code(city_name: str) -> str:
#     """Get airport code from city name"""
#     codes = {
#         "mumbai": "BOM", "delhi": "DEL", "bangalore": "BLR", 
#         "bengaluru": "BLR", "chennai": "MAA", "hyderabad": "HYD",
#         "kolkata": "CCU", "pune": "PNQ", "ahmedabad": "AMD",
#         "goa": "GOI", "kochi": "COK", "jaipur": "JAI"
#     }
#     return codes.get(city_name.lower(), city_name.upper()[:3])

async def call_gemini(prompt: str, temperature: float = 0.1, model_name: str = 'gemini-1.5-flash') -> str:
    try:
        model = genai.GenerativeModel(
            model_name,
            generation_config={"temperature": temperature}
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini API Error:", e)
        return "Unable to generate response at this time"

async def get_airport_code(city_name: str) -> str:
    airport_codes = {
        'delhi': 'DEL',
        'mumbai': 'BOM',
        'bangalore': 'BLR',
        'chennai': 'MAA',
        'kolkata': 'CCU',
        'hyderabad': 'HYD',
        'pune': 'PNQ',
        'ahmedabad': 'AMD',
        'goa': 'GOI',
        'kochi': 'COK',
        'jaipur': 'JAI',
        'lucknow': 'LKO',
        'chandigarh': 'IXC',
        'bhubaneswar': 'BBI',
        'indore': 'IDR'
    }

    normalized_city = city_name.strip().lower()

    if normalized_city in airport_codes:
        return airport_codes[normalized_city]

    try:
        prompt = f'Analyze the city name "{city_name}" and return ONLY its IATA airport code in uppercase. Example responses: DEL, BOM, BLR. No other text.'
        response_text = await call_gemini(prompt, temperature=0.1)

        match = re.search(r'\b[A-Z]{3}\b', response_text)
        if match:
            return match.group(0)

        # Fallback if Gemini gives unexpected result
        return normalized_city[:3].upper()

    except Exception as e:
        print('Gemini IATA lookup failed:', e)
        return 'XXX'

def get_fallback_flights(origin: str, destination: str) -> List[dict]:
    """Provide fallback flight data when SerpAPI fails"""
    import random
    
    airlines = [
        {"name": "IndiGo", "code": "6E"},
        {"name": "Air India", "code": "AI"},
        {"name": "SpiceJet", "code": "SG"},
        {"name": "Vistara", "code": "UK"}
    ]
    
    base_price = 8500
    times = ["06:30", "09:15", "12:45", "15:30", "18:20", "21:10"]
    
    flights = []
    for i, airline in enumerate(airlines):
        price = base_price + random.randint(-2000, 3000)
        departure_time = random.choice(times)
        
        flights.append({
            "id": f"fallback_{i}",
            "airline": airline["name"],
            "price": f"₹{price:,}",
            "departure_time": departure_time,
            "arrival_time": f"{int(departure_time[:2]) + 2}:{departure_time[3:]}",
            "duration": f"{random.randint(1, 3)}h {random.randint(15, 55)}m",
            "stops": 0,
            "bookingUrl": f"https://www.{airline['name'].lower().replace(' ', '')}.com",
            "source": "fallback"
        })
    
    return flights

# @app.post("/api/v1/resumes/upload")
# async def upload_resumes(files: List[UploadFile] = File(...), job_id: str = Form(...)):
#     """Upload and process resumes"""
#     if not supervisor:
#         raise HTTPException(status_code=500, detail="Supervisor not initialized")
    
#     try:
#         uploaded_resumes = []
        
#         for file in files:
#             content = await file.read()
#             uploaded_resumes.append({
#                 "filename": file.filename,
#                 "content": content,
#                 "size": len(content)
#             })
        
#         # Process with supervisor
#         state = NaviHireState(
#             messages=[HumanMessage(content=f"Process {len(files)} resumes for job {job_id}")],
#             user_id="api_user",
#             session_id=str(uuid.uuid4()),
#             user_role="hr_manager",
#             current_job_id=job_id,
#             uploaded_resumes=uploaded_resumes,
#             candidate_matches=[],
#             job_description=None,
#             travel_requests=[],
#             flight_results=None,
#             travel_policy=None,
#             current_task="resume_analysis",
#             next_action="resume_analysis",
#             task_progress={},
#             hr_metrics={},
#             travel_metrics={},
#             conversation_history=[],
#             user_preferences={}
#         )
        
#         result = supervisor.graph.invoke(state)
        
#         return {
#             "success": True,
#             "status": "success",
#             "processed_resumes": len(files),
#             "analysis_results": result.get("task_progress", {}).get("resume_analysis", {}),
#             "message": "Resumes processed successfully"
#         }
#     except Exception as e:
#         return {
#             "success": False,
#             "error": str(e),
#             "message": "Failed to process resumes"
#         }

from config.database import get_database_session, close_database_session
from sqlalchemy.orm import Session

@app.post("/api/v1/resumes/upload")
async def upload_and_analyze_resumes(
    files: List[UploadFile] = File(...), 
    job_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """Upload and analyze resumes with proper processing"""
    try:
        print(f"📄 Received {len(files)} files for processing")
        print(f"🎯 Job ID: {job_id}")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Initialize HR service
        hr_service = HRService(db)
        
        # Process uploaded files
        uploaded_resumes = []
        for file in files:
            try:
                # Read file content
                content = await file.read()
                print(f"📖 Read file: {file.filename} ({len(content)} bytes)")
                
                # Validate file type
                if not file.filename.lower().endswith(('.pdf', '.doc', '.docx', '.txt')):
                    print(f"⚠️ Skipping unsupported file: {file.filename}")
                    continue
                
                uploaded_resumes.append({
                    "filename": file.filename,
                    "content": content,
                    "size": len(content),
                    "content_type": file.content_type
                })
                
            except Exception as e:
                print(f"❌ Error reading file {file.filename}: {e}")
                continue
        
        if not uploaded_resumes:
            raise HTTPException(status_code=400, detail="No valid resume files found")
        
        print(f"✅ Successfully prepared {len(uploaded_resumes)} resumes for processing")
        
        # Process resumes using HR service
        job_id_int = int(job_id) if job_id and job_id.isdigit() else None
        result = await hr_service.process_resume_batch(uploaded_resumes, job_id_int)
        
        print(f"🎉 Processing result: {result}")
        
        return {
            "success": True,
            "message": f"Successfully processed {result.get('total_processed', 0)} resumes",
            "total_uploaded": len(files),
            "total_processed": result.get('total_processed', 0),
            "failed_count": len(result.get('failed_resumes', [])),
            "processed_resumes": result.get('processed_resumes', []),
            "failed_resumes": result.get('failed_resumes', []),
            "matching_results": result.get('matching_results')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Resume upload processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Resume processing failed: {str(e)}")

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    auth_service = AuthService(db)
    result = auth_service.verify_token(credentials.credentials)
    
    if not result.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("message", "Invalid authentication"),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return result["user"]

@app.post("/api/v1/auth/login")
async def login(credentials: dict, db: Session = Depends(get_db)):
    """User login endpoint"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            return {
                "success": False,
                "message": "Email and password are required"
            }
        
        auth_service = AuthService(db)
        result = auth_service.authenticate_user(email, password)
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Login failed: {str(e)}"
        }

@app.get("/api/v1/auth/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify token and get user info"""
    return {
        "valid": True,
        "user": current_user
    }

@app.post("/api/v1/auth/logout")
async def logout():
    """User logout endpoint"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }


# @app.websocket("/ws/chat/{user_id}")
# async def websocket_endpoint(websocket: WebSocket, user_id: str):
#     await manager.connect(websocket, user_id)
    
#     # Send welcome message
#     await websocket.send_text(json.dumps({
#         "type": "message",
#         "content": "Welcome to NaviHire! I can help you with resume analysis, candidate matching, and travel optimization. How can I assist you today?",
#         "agent": "system"
#     }))
    
#     try:
#         while True:
#             data = await websocket.receive_text()
#             message_data = json.loads(data)
#             user_message = message_data.get("message", "")
            
#             if not user_message.strip():
#                 continue
            
#             if not supervisor:
#                 await websocket.send_text(json.dumps({
#                     "type": "error",
#                     "content": "AI supervisor is not available. Please try again later.",
#                     "agent": "system"
#                 }))
#                 continue
            
#             # Create state
#             state = NaviHireState(
#                 messages=[HumanMessage(content=user_message)],
#                 user_id=user_id,
#                 session_id=str(uuid.uuid4()),
#                 user_role="hr_manager",
#                 current_job_id=None,
#                 uploaded_resumes=[],
#                 candidate_matches=[],
#                 job_description=None,
#                 travel_requests=[],
#                 flight_results=None,
#                 travel_policy=None,
#                 current_task=None,
#                 next_action=None,
#                 task_progress={},
#                 hr_metrics={},
#                 travel_metrics={},
#                 conversation_history=[],
#                 user_preferences={}
#             )
            
#             # Process with supervisor
#             result = supervisor.graph.invoke(state)
            
#             # Send response
#             response = result["messages"][-1].content
#             await websocket.send_text(json.dumps({
#                 "type": "message",
#                 "content": response,
#                 "agent": result.get("current_task", "general"),
#                 "task_progress": result.get("task_progress", {})
#             }))
            
#     except WebSocketDisconnect:
#         manager.disconnect(user_id)
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#         manager.disconnect(user_id)

@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    # Send welcome message
    await websocket.send_text(json.dumps({
        "type": "message",
        "content": "Welcome to NaviHire! I can help you with resume analysis, candidate matching, and travel optimization. How can I assist you today?",
        "agent": "system",
        "timestamp": datetime.now().isoformat()
    }))
    
    # Set up ping/pong for connection health
    last_pong = datetime.now()
    
    try:
        while True:
            # Wait for message with timeout
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                message_data = json.loads(data)
                
                # Handle ping messages
                if message_data.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    last_pong = datetime.now()
                    continue
                
                user_message = message_data.get("message", "")
                
                if not user_message.strip():
                    continue
                
                if not supervisor:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "content": "AI supervisor is not available. Please try again later.",
                        "agent": "system",
                        "timestamp": datetime.now().isoformat()
                    }))
                    continue
                
                # Send typing indicator
                await websocket.send_text(json.dumps({
                    "type": "typing",
                    "content": "NaviHire is thinking...",
                    "timestamp": datetime.now().isoformat()
                }))
                
                # Create state
                state = NaviHireState(
                    messages=[HumanMessage(content=user_message)],
                    user_id=user_id,
                    session_id=str(uuid.uuid4()),
                    user_role="hr_manager",
                    current_job_id=None,
                    uploaded_resumes=[],
                    candidate_matches=[],
                    job_description=None,
                    travel_requests=[],
                    flight_results=None,
                    travel_policy=None,
                    current_task=None,
                    next_action=None,
                    task_progress={},
                    hr_metrics={},
                    travel_metrics={},
                    conversation_history=[],
                    user_preferences={}
                )
                
                # Process with supervisor
                result = supervisor.graph.invoke(state)
                
                # Send response
                response = result["messages"][-1].content
                await websocket.send_text(json.dumps({
                    "type": "message",
                    "content": response,
                    "agent": result.get("current_task", "general"),
                    "task_progress": result.get("task_progress", {}),
                    "timestamp": datetime.now().isoformat()
                }))
                
                last_pong = datetime.now()
                
            except asyncio.TimeoutError:
                # Check if connection is still alive
                current_time = datetime.now()
                if (current_time - last_pong).seconds > 120:  # 2 minutes without pong
                    print(f"⏰ Connection timeout for user {user_id}")
                    break
                
                # Send keep-alive ping
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": current_time.isoformat()
                    }))
                except:
                    break
                    
    except WebSocketDisconnect:
        print(f"🔌 User {user_id} disconnected normally")
        manager.disconnect(user_id)
    except Exception as e:
        print(f"❌ WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)
    finally:
        manager.disconnect(user_id)


# Serve React app for all other routes
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve React frontend"""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    if full_path.startswith("static/"):
        file_path = frontend_build_path / full_path
        if file_path.exists():
            return FileResponse(file_path)
    
    # Serve index.html for all other routes (React Router)
    index_file = frontend_build_path / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return JSONResponse(content={
        "message": "NaviHire Backend is Running",
        "frontend_build": "not found",
        "instructions": "Please build the React app: cd frontend && npm run build"
    })

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NaviHire - AI-Powered Talent & Travel Intelligence Platform")
    print("📊 Dashboard: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/api/health")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)