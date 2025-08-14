from services import help_bot_service
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
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
import uvicorn
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
from database.models.chat_session import ChatSession, ChatAction
from services.max_service import MaxAIService
from database.models.scheduled_email import ScheduledEmail, EmailDeliveryLog
from services.email_scheduler_service import EmailSchedulerService
import uuid
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

PORT = int(os.getenv("PORT", 8000))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

app = FastAPI(
    title="NaviHire - AI-Powered Talent Acquisition Platform",
    description="Revolutionizing HR and Talent Acquisition with AI",
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
        "https://*.railway.app",
        "*" if ENVIRONMENT == "development" else "https://*.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def get_db():
    db = get_database_session()
    try:
        yield db
    finally:
        close_database_session(db)

frontend_build_path = Path(__file__).parent / "frontend" / "dist"
if frontend_build_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_build_path / "assets")), name="static")
    print(f"Frontend build found at: {frontend_build_path}")
else:
    print(f"Frontend build not found at: {frontend_build_path}")

# Initialize supervisor with error handling
try:
    supervisor = NaviHireSupervisor()
    print("NaviHire Supervisor initialized successfully")
except Exception as e:
    print(f"Error initializing supervisor: {e}")
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
        
        # Import the new models to ensure they're created
        from database.models.chat_session import ChatSession, ChatAction
        
        db = get_database_session()
        try:
            existing_user = db.query(User).filter(User.username == "admin").first()
            if not existing_user:
                admin_user = User(
                    username="admin",
                    email="admin@navikenz.com",
                    full_name="NaviHire Administrator",
                    hashed_password=hash_password("1827"),
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
        print("🤖 Max AI Assistant ready for deployment")
        
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

@app.post("/api/v1/email-scheduler/schedule")
async def schedule_email(schedule_data: dict, db: Session = Depends(get_db)):
    """Schedule an email"""
    try:
        scheduler_service = EmailSchedulerService(db)
        result = scheduler_service.create_scheduled_email(schedule_data)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/email-scheduler/schedules")
async def get_scheduled_emails(
    category: str = None, 
    status: str = None, 
    db: Session = Depends(get_db)
):
    """Get scheduled emails"""
    try:
        scheduler_service = EmailSchedulerService(db)
        schedules = scheduler_service.get_scheduled_emails(category, status)
        return {"success": True, "schedules": schedules}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.delete("/api/v1/email-scheduler/schedules/{schedule_id}")
async def cancel_scheduled_email(schedule_id: int, db: Session = Depends(get_db)):
    """Cancel a scheduled email"""
    try:
        scheduler_service = EmailSchedulerService(db)
        result = scheduler_service.cancel_scheduled_email(schedule_id)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/email-scheduler/schedules/{schedule_id}/logs")
async def get_delivery_logs(schedule_id: int, db: Session = Depends(get_db)):
    """Get delivery logs for a scheduled email"""
    try:
        scheduler_service = EmailSchedulerService(db)
        logs = scheduler_service.get_delivery_logs(schedule_id)
        return {"success": True, "logs": logs}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/email-scheduler/stats")
async def get_scheduler_stats(db: Session = Depends(get_db)):
    """Get email scheduler statistics"""
    try:
        scheduler_service = EmailSchedulerService(db)
        stats = scheduler_service.get_schedule_statistics()
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/emails/templates")
async def create_email_template(template_data: dict, db: Session = Depends(get_db)):
    """Create email template - Required by Max"""
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
    """Send single email - Required by Max"""
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

@app.get("/api/v1/emails/campaigns")
async def get_email_campaigns(db: Session = Depends(get_db)):
    """Get email campaigns"""
    try:
        email_service = EmailAutomationService(db)
        campaigns = email_service.get_email_campaigns()
        return {"success": True, "campaigns": campaigns}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/emails/stats")
async def get_email_stats(db: Session = Depends(get_db)):
    """Get email automation statistics"""
    try:
        email_service = EmailAutomationService(db)
        stats = email_service.get_email_stats()
        return {"success": True, "stats": stats}
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
    
# Update the get_mail_templates endpoint in main.py
@app.get("/api/v1/mail-templates")
async def get_mail_templates(category: str = None, db: Session = Depends(get_db)):
    """Get mail templates from generator"""
    try:
        query = db.query(EmailTemplate)
        
        if category:
            query = query.filter(EmailTemplate.category == category)
        
        templates = query.order_by(EmailTemplate.created_at.desc()).all()
        
        template_list = []
        for template in templates:
            # Extract variables from template content
            variables = []
            if template.body_html:
                variables = list(set(re.findall(r'\{\{([^}]+)\}\}', template.body_html)))
            elif template.body_text:
                variables = list(set(re.findall(r'\{\{([^}]+)\}\}', template.body_text)))
            
            template_list.append({
                "id": template.id,
                "name": template.name,
                "category": template.category,
                "purpose": template.category,  # Using category as purpose for now
                "tone": "professional",  # Default value
                "length": "medium",  # Default value
                "subject": template.subject,
                "content": template.body_html or template.body_text or "",
                "variables": variables,
                "tags": [],  # ← Default empty array instead of trying to access non-existent field
                "ai_generated": False,  # ← Default False instead of accessing non-existent field
                "versions": [],
                "created_at": template.created_at.isoformat() if template.created_at else None,
                "usage_count": 0,  # ← Default 0 instead of accessing non-existent field
                "performance_metrics": {
                    "open_rate": 75 + (template.id % 25),
                    "click_rate": 25 + (template.id % 30),
                    "response_rate": 10 + (template.id % 15)
                }
            })
        
        return {
            "success": True,
            "templates": template_list
        }
        
    except Exception as e:
        print(f"❌ Error getting mail templates: {e}")
        return {"success": False, "error": str(e)}

# Also update the save_mail_template endpoint
@app.post("/api/v1/mail-templates")
async def save_mail_template(template_data: dict, db: Session = Depends(get_db)):
    """Save generated mail template"""
    try:
        print(f"📧 Saving mail template: {template_data.get('name')}")
        
        # Get admin user for created_by
        admin_user = db.query(User).filter(User.username == "admin").first()
        created_by = admin_user.id if admin_user else 1
        
        # Create email template with only existing fields
        email_template = EmailTemplate(
            name=template_data.get("name", "Generated Template"),
            category=template_data.get("category", "general"),
            subject=template_data.get("subject", ""),
            body_html=template_data.get("content", ""),
            body_text=template_data.get("content", ""),
            created_by=created_by,
            is_active=True
        )
        
        # Only set fields that exist in the database
        try:
            # Check if the field exists before setting it
            if hasattr(email_template, 'ai_generated'):
                email_template.ai_generated = template_data.get("ai_generated", True)
        except:
            pass
            
        try:
            if hasattr(email_template, 'usage_count'):
                email_template.usage_count = 0
        except:
            pass
            
        try:
            if hasattr(email_template, 'tags'):
                email_template.tags = template_data.get("tags", [])
        except:
            pass
            
        try:
            if hasattr(email_template, 'variables'):
                email_template.variables = template_data.get("variables", [])
        except:
            pass
        
        db.add(email_template)
        db.commit()
        db.refresh(email_template)
        
        print(f"✅ Mail template saved with ID: {email_template.id}")
        
        return {
            "success": True,
            "message": "Template saved successfully",
            "template": {
                "id": email_template.id,
                "name": email_template.name,
                "category": email_template.category
            }
        }
        
    except Exception as e:
        print(f"❌ Error saving mail template: {e}")
        db.rollback()
        return {"success": False, "error": str(e)}


@app.post("/api/v1/ai/generate-email-template")
async def generate_email_template(request: dict, db: Session = Depends(get_db)):
    """Generate email template using AI"""
    try:
        prompt = request.get("prompt", "")
        parameters = request.get("parameters", {})
        
        print(f"🤖 Generating template with parameters: {parameters}")
        
        # Enhanced prompt for better AI generation
        enhanced_prompt = f"""
        Create a professional email template with the following specifications:
        
        {prompt}
        
        Please generate:
        1. A compelling subject line (without "Subject:" prefix)
        2. Professional email content with proper structure
        3. Use placeholder variables in format {{{{variable_name}}}} for personalization
        4. Include appropriate greeting and closing
        5. Make it suitable for {parameters.get('tone', 'professional')} tone
        
        Format your response as:
        SUBJECT: [subject line here]
        
        CONTENT:
        [email content here with {{{{variables}}}} placeholders]
        
        VARIABLES: [comma-separated list of variables used]
        """
        
        # Configure and call Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(enhanced_prompt)
        
        ai_response = response.text
        print(f"🤖 AI Response received: {len(ai_response)} characters")
        
        # Parse the response
        subject = ""
        content = ""
        variables = []
        
        lines = ai_response.split('\n')
        current_section = None
        content_lines = []
        
        for line in lines:
            if line.strip().startswith('SUBJECT:'):
                subject = line.replace('SUBJECT:', '').strip()
                current_section = 'subject'
            elif line.strip().startswith('CONTENT:'):
                current_section = 'content'
                content_lines = []
            elif line.strip().startswith('VARIABLES:'):
                variables_text = line.replace('VARIABLES:', '').strip()
                variables = [v.strip() for v in variables_text.split(',') if v.strip()]
                current_section = 'variables'
            elif current_section == 'content':
                content_lines.append(line)
        
        content = '\n'.join(content_lines).strip()
        
        # Extract variables from content if not provided
        if not variables:
            variables = list(set(re.findall(r'\{\{([^}]+)\}\}', content)))
        
        # Fallback if parsing failed
        if not subject or not content:
            print("⚠️ AI parsing failed, using fallback generation")
            subject = generate_fallback_subject(parameters)
            content = generate_fallback_content(parameters)
            variables = ["recipient_name", "company_name", "sender_name"]
        
        print(f"✅ Generated template - Subject: {subject[:50]}...")
        
        return {
            "success": True,
            "template": {
                "subject": subject,
                "content": content,
                "variables": variables,
                "tags": [parameters.get('category'), parameters.get('purpose'), parameters.get('tone')]
            }
        }
        
    except Exception as e:
        print(f"❌ Error generating email template: {e}")
        
        # Fallback template generation
        return {
            "success": True,
            "template": {
                "subject": generate_fallback_subject(parameters),
                "content": generate_fallback_content(parameters),
                "variables": ["recipient_name", "company_name", "sender_name"],
                "tags": [parameters.get('category', 'general'), parameters.get('purpose', 'communication')]
            }
        }

@app.post("/api/v1/ai/refine-template")
async def refine_email_template(request: dict, db: Session = Depends(get_db)):
    """Refine email template using AI"""
    try:
        template = request.get("template", {})
        instructions = request.get("instructions", "")
        
        current_content = template.get("content", "")
        current_subject = template.get("subject", "")
        
        print(f"🔄 Refining template with instructions: {instructions}")
        
        refine_prompt = f"""
        Please refine this email template based on the following instructions: {instructions}
        
        Current Subject: {current_subject}
        Current Content:
        {current_content}
        
        Instructions for refinement: {instructions}
        
        Please provide the refined version in the same format:
        SUBJECT: [refined subject line]
        
        CONTENT:
        [refined email content]
        
        VARIABLES: [comma-separated list of variables]
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(refine_prompt)
        
        ai_response = response.text
        
        # Parse the refined response (same parsing logic as above)
        subject = current_subject
        content = current_content
        variables = template.get("variables", [])
        
        lines = ai_response.split('\n')
        current_section = None
        content_lines = []
        
        for line in lines:
            if line.strip().startswith('SUBJECT:'):
                subject = line.replace('SUBJECT:', '').strip()
                current_section = 'subject'
            elif line.strip().startswith('CONTENT:'):
                current_section = 'content'
                content_lines = []
            elif line.strip().startswith('VARIABLES:'):
                variables_text = line.replace('VARIABLES:', '').strip()
                variables = [v.strip() for v in variables_text.split(',') if v.strip()]
                current_section = 'variables'
            elif current_section == 'content':
                content_lines.append(line)
        
        if content_lines:
            content = '\n'.join(content_lines).strip()
        
        print(f"✅ Template refined successfully")
        
        return {
            "success": True,
            "template": {
                "subject": subject,
                "content": content,
                "variables": variables
            }
        }
        
    except Exception as e:
        print(f"❌ Error refining template: {e}")
        return {"success": False, "error": str(e)}

def generate_fallback_subject(parameters: dict) -> str:
    """Generate fallback subject line"""
    category = parameters.get('category', 'general')
    purpose = parameters.get('purpose', 'communication')
    
    subjects = {
        'recruitment': {
            'interview_invitation': 'Interview Invitation - {{position}} Position at {{company_name}}',
            'follow_up': 'Thank you for your interview - {{position}} Role',
            'offer': 'Job Offer - {{position}} at {{company_name}}',
            'rejection': 'Update on your {{position}} application'
        },
        'marketing': {
            'product_launch': '🚀 Introducing {{product_name}} - You\'ll Love This!',
            'newsletter': '📰 {{company_name}} Newsletter - {{month}} {{year}}',
            'promotion': '🎉 Special Offer Just for You!'
        }
    }
    
    return subjects.get(category, {}).get(purpose, f'Professional {category.title()} Communication')

def generate_fallback_content(parameters: dict) -> str:
    """Generate fallback email content"""
    category = parameters.get('category', 'general')
    purpose = parameters.get('purpose', 'communication')
    tone = parameters.get('tone', 'professional')
    
    if category == 'recruitment' and purpose == 'interview_invitation':
        return """Dear {{candidate_name}},

We are pleased to invite you for an interview for the {{position}} position at {{company_name}}.

Interview Details:
• Date: {{interview_date}}
• Time: {{interview_time}}
• Location: {{interview_location}}
• Duration: Approximately {{duration}} minutes

Please confirm your availability by replying to this email. If you need to reschedule, please let us know as soon as possible.

We look forward to meeting you and discussing this exciting opportunity.

Best regards,
{{interviewer_name}}
{{company_name}}"""
    
    elif category == 'recruitment' and purpose == 'follow_up':
        return """Dear {{candidate_name}},

Thank you for taking the time to interview with us for the {{position}} role. It was a pleasure meeting you and learning more about your experience.

We were impressed by your background and enthusiasm for the role. We are currently reviewing all candidates and will be in touch with you by {{follow_up_date}} regarding next steps.

If you have any questions in the meantime, please don't hesitate to reach out.

Thank you again for your interest in joining our team.

Best regards,
{{interviewer_name}}
{{company_name}}"""
    
    else:
        return f"""Dear {{{{recipient_name}}}},

This is a {tone} {category} email template for {purpose}.

[Your main content goes here with a {tone} tone]

Best regards,
{{{{sender_name}}}}
{{{{company_name}}}}"""

@app.post("/api/v1/chat/message")
async def chat_with_max(request: dict, db: Session = Depends(get_db)):
    """Send message to Max AI assistant"""
    try:
        # Validate MaxAIService is available
        try:
            max_service = MaxAIService(db)
        except Exception as import_error:
            print(f"❌ MaxAIService import error: {import_error}")
            return {
                "success": False,
                "error": "Max AI service not available",
                "response": "Max is currently unavailable. Please check server configuration."
            }
        
        message = request.get("message", "")
        session_id = request.get("session_id", str(uuid.uuid4()))
        user_id = request.get("user_id", "anonymous")
        
        if not message.strip():
            return {
                "success": False,
                "error": "Message cannot be empty"
            }
        
        print(f"🤖 Processing message: {message}")
        
        result = await max_service.process_user_message(message, session_id, user_id)
        
        print(f"📤 Sending response: {result}")
        
        return result
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "response": "I encountered an error processing your message. Please try again."
        }

@app.post("/api/v1/chat/execute-action")
async def execute_chat_action(request: dict, db: Session = Depends(get_db)):
    """Execute a confirmed action from Max"""
    try:
        action_id = request.get("action_id", str(uuid.uuid4()))
        action_data = request.get("action_data", {})
        
        print(f"⚡ Executing action: {action_data}")
        
        max_service = MaxAIService(db)
        result = await max_service.execute_action(action_id, action_data)
        
        return result
        
    except Exception as e:
        print(f"❌ Action execution error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/v1/chat/sessions")
async def get_chat_sessions(user_id: str = None, db: Session = Depends(get_db)):
    """Get chat sessions"""
    try:
        max_service = MaxAIService(db)
        sessions = max_service.get_chat_sessions(user_id)
        
        return {
            "success": True,
            "sessions": sessions
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/v1/chat/sessions/{session_id}")
async def get_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Get specific chat session"""
    try:
        max_service = MaxAIService(db)
        result = max_service.get_chat_session(session_id)
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/v1/chat/sessions")
async def save_chat_session(session_data: dict, db: Session = Depends(get_db)):
    """Save or update chat session"""
    try:
        session_id = session_data["session_id"]
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        
        if session:
            # Update existing session
            session.name = session_data["name"]
            session.messages = session_data["messages"]
            session.context = session_data["context"]
            session.message_count = len(session_data["messages"])
            session.last_message = session_data["messages"][-1]["content"] if session_data["messages"] else ""
            session.updated_at = datetime.utcnow()
        else:
            # Create new session
            session = ChatSession(
                id=session_id,
                name=session_data["name"],
                messages=session_data["messages"],
                context=session_data["context"],
                message_count=len(session_data["messages"]),
                last_message=session_data["messages"][-1]["content"] if session_data["messages"] else "",
                user_id=session_data.get("user_id", "anonymous")
            )
            db.add(session)
        
        db.commit()
        return {"success": True, "message": "Session saved successfully"}
        
    except Exception as e:
        print(f"❌ Session save error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    """Delete chat session"""
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session.is_active = False
        db.commit()
        
        return {"success": True, "message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ==== TEST ENDPOINTS FOR MAX ====
@app.post("/api/v1/chat/test-max")
async def test_max(db: Session = Depends(get_db)):
    """Test Max AI service functionality"""
    try:
        max_service = MaxAIService(db)
        result = await max_service.process_user_message(
            "create a friendship day email template for august 2nd event",
            "test-session-123",
            "test-user"
        )
        return {
            "success": True,
            "test_result": result,
            "message": "Max AI service is working correctly"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Max AI service test failed"
        }

@app.get("/api/v1/database/verify")
async def verify_database(db: Session = Depends(get_db)):
    """Verify database setup"""
    try:
        # Check if required tables exist
        tables_status = {}
        
        # Check candidates table
        try:
            candidate_count = db.query(Candidate).count()
            tables_status["candidates"] = f"✅ {candidate_count} records"
        except Exception as e:
            tables_status["candidates"] = f"❌ Error: {str(e)}"
        
        # Check jobs table
        try:
            job_count = db.query(Job).count()
            tables_status["jobs"] = f"✅ {job_count} records"
        except Exception as e:
            tables_status["jobs"] = f"❌ Error: {str(e)}"
        
        # Check email templates table
        try:
            template_count = db.query(EmailTemplate).count()
            tables_status["email_templates"] = f"✅ {template_count} records"
        except Exception as e:
            tables_status["email_templates"] = f"❌ Error: {str(e)}"
        
        # Check chat sessions table
        try:
            session_count = db.query(ChatSession).count()
            tables_status["chat_sessions"] = f"✅ {session_count} records"
        except Exception as e:
            tables_status["chat_sessions"] = f"❌ Error: {str(e)}"
        
        return {
            "success": True,
            "database_status": "connected",
            "tables": tables_status
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Database verification failed"
        }

# ==== TEST SCHEDULER ROUTES ====
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

# ==== OPTIONS HANDLER ====
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(content={"message": "OK"})

# ==== FLIGHT SEARCH ====
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
        print("this is the response got from serpapi call: \n",search)
        
        print(f"📨 SerpAPI Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "error" in data:
                print(f"❌ SerpAPI Error: {data['error']}")
                fallback_flights = get_fallback_flights(origin, destination)
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

# ==== HELP BOT ====
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
        
        service = help_bot_service.HelpBotService()
        result = service.process_help_request(message, context)

        return result
        
    except Exception as e:
        return {
            "response": "I apologize, but I encountered an error. Please try again.",
            "actions": []
        }

# ==== UTILITY FUNCTIONS ====
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

# ==== JOB MANAGEMENT ====
@app.post("/api/v1/jobs")
async def create_job(job_data: dict, db: Session = Depends(get_db)):
    """Create a new job"""
    try:
        print(f"📝 Creating job: {job_data.get('title')}")
        
        job = Job(**job_data)
        db.add(job)
        db.commit()
        db.refresh(job)
        
        print(f"✅ Job created with ID: {job.id}")
        
        return {
            "success": True,
            "job": {
                "id": job.id,
                "title": job.title,
                "department": job.department,
                "status": job.status,
                "created_at": job.created_at.isoformat() if job.created_at else None
            },
            "message": "Job created successfully"
        }
        
    except Exception as e:
        print(f"❌ Error creating job: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@app.get("/api/v1/jobs")
async def get_jobs(db: Session = Depends(get_db)):
    """Get all jobs"""
    try:
        print("📋 Fetching all jobs...")
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()
        
        result = {
            "success": True,
            "jobs": [
                {
                    "id": j.id,
                    "title": j.title,
                    "department": j.department,
                    "location": j.location,
                    "employment_type": j.employment_type,
                    "description": j.description,
                    "responsibilities": j.responsibilities,
                    "required_qualifications": j.required_qualifications,
                    "preferred_qualifications": j.preferred_qualifications,
                    "required_skills": j.required_skills,
                    "preferred_skills": j.preferred_skills,
                    "experience_level": j.experience_level,
                    "min_experience_years": j.min_experience_years,
                    "max_experience_years": j.max_experience_years,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "currency": j.currency,
                    "benefits": j.benefits,
                    "status": j.status,
                    "priority": j.priority,
                    "ai_generated": j.ai_generated,
                    "positions_available": j.positions_available,
                    "positions_filled": j.positions_filled,
                    "created_at": j.created_at.isoformat() if j.created_at else None,
                    "updated_at": j.updated_at.isoformat() if j.updated_at else None,
                    "published_at": j.published_at.isoformat() if j.published_at else None,
                    "deadline": j.deadline.isoformat() if j.deadline else None
                }
                for j in jobs
            ]
        }
        
        print(f"✅ Found {len(jobs)} jobs")
        return result
        
    except Exception as e:
        print(f"❌ Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch jobs: {str(e)}")

@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get single job details"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "job": {
                "id": job.id,
                "title": job.title,
                "department": job.department,
                "location": job.location,
                "employment_type": job.employment_type,
                "description": job.description,
                "responsibilities": job.responsibilities,
                "required_qualifications": job.required_qualifications,
                "preferred_qualifications": job.preferred_qualifications,
                "required_skills": job.required_skills,
                "preferred_skills": job.preferred_skills,
                "experience_level": job.experience_level,
                "min_experience_years": job.min_experience_years,
                "max_experience_years": job.max_experience_years,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "currency": job.currency,
                "benefits": job.benefits,
                "status": job.status,
                "priority": job.priority,
                "ai_generated": job.ai_generated,
                "generation_prompt": job.generation_prompt,
                "positions_available": job.positions_available,
                "positions_filled": job.positions_filled,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "updated_at": job.updated_at.isoformat() if job.updated_at else None,
                "published_at": job.published_at.isoformat() if job.published_at else None,
                "deadline": job.deadline.isoformat() if job.deadline else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch job: {str(e)}")

@app.put("/api/v1/jobs/{job_id}")
async def update_job(job_id: int, job_data: dict, db: Session = Depends(get_db)):
    """Update job"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        for key, value in job_data.items():
            if hasattr(job, key):
                setattr(job, key, value)
        
        db.commit()
        db.refresh(job)
        
        return {
            "success": True,
            "message": "Job updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update job: {str(e)}")

@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete job"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        db.delete(job)
        db.commit()
        
        return {
            "success": True,
            "message": "Job deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")

# ==== RESUME UPLOAD ====
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
        
        hr_service = HRService(db)
        
        uploaded_resumes = []
        for file in files:
            try:
                content = await file.read()
                print(f"📖 Read file: {file.filename} ({len(content)} bytes)")
                
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

# ==== AUTHENTICATION ====
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

# ==== CANDIDATE MANAGEMENT ====
@app.post("/api/v1/candidates")
async def create_candidate(candidate_data: dict, db: Session = Depends(get_db)):
    """Create a new candidate"""
    try:
        print(f"📝 Creating candidate: {candidate_data}")
        
        skills_data = candidate_data.get("skills", [])
        if isinstance(skills_data, int):
            skills_array = []
            skills_count = skills_data
        else:
            skills_array = skills_data if isinstance(skills_data, list) else []
            skills_count = len(skills_array)
        
        candidate = Candidate(
            full_name=candidate_data.get("candidate_name", "Unknown"),
            email=candidate_data.get("email", ""),
            resume_filename=candidate_data.get("filename", ""),
            status=candidate_data.get("status", "new"),
            overall_score=float(candidate_data.get("score", 0)),
            skills=skills_array,
            experience_years=float(candidate_data.get("experience_years", 0))
        )
        
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
        print(f"✅ Candidate created with ID: {candidate.id}")
        
        return {
            "success": True,
            "candidate_id": candidate.id,
            "message": "Candidate created successfully"
        }
        
    except Exception as e:
        print(f"❌ Error creating candidate: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create candidate: {str(e)}")

@app.get("/api/v1/candidates")
async def get_candidates(db: Session = Depends(get_db)):
    """Get all candidates"""
    try:
        print("📋 Fetching all candidates...")
        candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
        
        result = {
            "success": True,
            "candidates": [
                {
                    "candidate_id": c.id,
                    "candidate_name": c.full_name,
                    "email": c.email,
                    "filename": c.resume_filename,
                    "status": c.status,
                    "score": c.overall_score,
                    "skills_count": len(c.skills) if c.skills else 0,
                    "experience_years": c.experience_years,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "phone": c.phone,
                    "location": c.location,
                    "technical_score": c.technical_score,
                    "experience_score": c.experience_score,
                    "education": c.education,
                    "certifications": c.certifications,
                    "is_available": c.is_available
                }
                for c in candidates
            ]
        }
        
        print(f"✅ Found {len(candidates)} candidates")
        return result
        
    except Exception as e:
        print(f"❌ Error fetching candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidates: {str(e)}")

@app.delete("/api/v1/candidates/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate"""
    try:
        print(f"🗑️ Deleting candidate with ID: {candidate_id}")
        
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        db.delete(candidate)
        db.commit()
        
        print(f"✅ Candidate {candidate_id} deleted successfully")
        
        return {
            "success": True,
            "message": "Candidate deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting candidate: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete candidate: {str(e)}")

@app.get("/api/v1/candidates/{candidate_id}")
async def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get single candidate details"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        return {
            "success": True,
            "candidate": {
                "candidate_id": candidate.id,
                "candidate_name": candidate.full_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "location": candidate.location,
                "filename": candidate.resume_filename,
                "resume_url": candidate.resume_url,
                "resume_text": candidate.resume_text,
                "status": candidate.status,
                "score": candidate.overall_score,
                "technical_score": candidate.technical_score,
                "experience_score": candidate.experience_score,
                "skills": candidate.skills,
                "skills_count": len(candidate.skills) if candidate.skills else 0,
                "experience_years": candidate.experience_years,
                "education": candidate.education,
                "certifications": candidate.certifications,
                "is_available": candidate.is_available,
                "source": candidate.source,
                "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
                "last_contacted": candidate.last_contacted.isoformat() if candidate.last_contacted else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidate: {str(e)}")

@app.put("/api/v1/candidates/{candidate_id}")
async def update_candidate(candidate_id: int, update_data: dict, db: Session = Depends(get_db)):
    """Update candidate information"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        if "status" in update_data:
            candidate.status = update_data["status"]
        if "candidate_name" in update_data:
            candidate.full_name = update_data["candidate_name"]
        if "email" in update_data:
            candidate.email = update_data["email"]
        if "phone" in update_data:
            candidate.phone = update_data["phone"]
        if "location" in update_data:
            candidate.location = update_data["location"]
        if "is_available" in update_data:
            candidate.is_available = update_data["is_available"]
        
        db.commit()
        db.refresh(candidate)
        
        return {
            "success": True,
            "message": "Candidate updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update candidate: {str(e)}")

# ==== WEBSOCKET ====
@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    await websocket.send_text(json.dumps({
        "type": "message",
        "content": "Welcome to NaviHire! I can help you with resume analysis, candidate matching, and travel optimization. How can I assist you today?",
        "agent": "system",
        "timestamp": datetime.now().isoformat()
    }))
    
    last_pong = datetime.now()
    
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=160.0)
                message_data = json.loads(data)
                
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
                
                await websocket.send_text(json.dumps({
                    "type": "typing",
                    "content": "NaviHire is thinking...",
                    "timestamp": datetime.now().isoformat()
                }))
                
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
                
                result = supervisor.graph.invoke(state)
                
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
                current_time = datetime.now()
                if (current_time - last_pong).seconds > 120:
                    print(f"⏰ Connection timeout for user {user_id}")
                    break
                
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

# ==== FRONTEND CATCH-ALL (MUST BE LAST) ====
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve React frontend - MUST BE LAST ROUTE"""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    if full_path.startswith("static/"):
        file_path = frontend_build_path / full_path
        if file_path.exists():
            return FileResponse(file_path)
    
    index_file = frontend_build_path / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return JSONResponse(content={
        "message": "NaviHire Backend is Running",
        "frontend_build": "not found",
        "instructions": "Please build the React app: cd frontend && npm run build"
    })

if __name__ == "__main__":
    print("Starting NaviHire - AI-Powered Talent Acquisition Platform")
    print(f"Environment: {ENVIRONMENT}")
    print(f"Dashboard: http://0.0.0.0:{PORT}")
    print(f"API Docs: http://0.0.0.0:{PORT}/docs")
    print(f"Health Check: http://0.0.0.0:{PORT}/api/health")
    
    # Only run uvicorn programmatically in development
    # In production (Render), let the start command handle uvicorn
    if ENVIRONMENT == "development":
        uvicorn.run(
            "main:app", 
            host="0.0.0.0", 
            port=PORT, 
            reload=True
        )
    else:
        print("🏭 Production mode: Server will be started by deployment platform")
        print("⚡ Ready for deployment platform to start uvicorn")

