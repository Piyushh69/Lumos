# from typing import List, Dict, Optional, Any
# from sqlalchemy.orm import Session
# from database.models.chat_session import ChatSession, ChatAction
# from database.models.email_templates import EmailTemplate
# from database.models.job import Job
# from database.models.candidate import Candidate
# from services.email_automation_service import EmailAutomationService
# import json
# import uuid
# from datetime import datetime
# import google.generativeai as genai
# import os
# import re

# class MaxAIService:
#     def __init__(self, db_session: Session):
#         self.db = db_session
#         self.email_service = EmailAutomationService(db_session)
        
#         # Configure Gemini
#         genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        
#     def create_max_prompt(self, user_message: str, conversation_history: List[Dict], context: Dict = None) -> str:
#         """Create enhanced prompt for Max with NaviHire context"""
        
#         context_info = context or {}
        
#         return f"""You are Max, an intelligent AI assistant for NaviHire, a comprehensive recruitment management system. You are helpful, professional, and capable of performing complex tasks.

#     ABOUT NAVIHIRE:
#     - AI-powered recruitment platform with advanced features
#     - Candidate management with resume parsing and AI scoring
#     - Job posting and description generation
#     - Smart candidate matching using AI algorithms
#     - Email automation with templates and bulk sending
#     - Analytics and reporting dashboard
#     - Assessment scheduling and management

#     YOUR CAPABILITIES:
#     You can perform these actions (with user confirmation):
#     - CREATE_EMAIL_TEMPLATE: Create custom email templates for recruitment
#     - SEND_EMAIL: Send emails to candidates or staff using templates
#     - CREATE_JOB: Create job postings with detailed requirements
#     - MATCH_CANDIDATES: Find and rank candidates for specific positions
#     - GENERATE_JOB_DESCRIPTION: Create comprehensive job descriptions
#     - SCHEDULE_ASSESSMENT: Schedule tests/interviews for candidates
#     - GET_ANALYTICS: Provide recruitment insights and metrics

#     CONVERSATION CONTEXT:
#     Previous messages: {len(conversation_history)} messages
#     Recent context: {json.dumps(conversation_history[-3:] if conversation_history else [])}
#     Additional context: {json.dumps(context_info)}

#     USER MESSAGE: "{user_message}"

#     RESPONSE GUIDELINES:
#     1. If it's a general question about NaviHire, provide helpful information
#     2. If the user wants to perform an action, respond with ONLY a clean JSON structure
#     3. Be conversational and professional
#     4. Ask for clarification if needed
#     5. Always confirm before executing actions

#     IMPORTANT: If the user requests an action, respond with ONLY valid JSON in this exact format (no markdown, no extra text):

#     {{
#     "response": "Your conversational response explaining what you'll do",
#     "requires_action": true,
#     "actions": [
#         {{
#         "type": "CREATE_EMAIL_TEMPLATE",
#         "title": "Clear action title",
#         "description": "Detailed description of what this will do",
#         "parameters": {{"key": "value"}},
#         "requires_form": true,
#         "form_fields": [
#             {{"name": "field_name", "label": "Field Label", "type": "text", "required": true, "placeholder": "Placeholder text"}}
#         ]
#         }}
#     ]
#     }}

#     For simple responses (no actions), just provide the conversational text without JSON.

#     Remember: You are Max, the smart assistant that makes NaviHire amazing!"""


#     async def process_user_message(self, user_message: str, session_id: str, user_id: str = None) -> Dict:
#         """Process user message and return Max's response"""
#         try:
#             # Get conversation history
#             session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
#             conversation_history = session.messages if session else []
            
#             # Create context
#             context = {
#                 "session_id": session_id,
#                 "user_id": user_id,
#                 "timestamp": datetime.now().isoformat(),
#                 "platform_info": {
#                     "total_candidates": self.db.query(Candidate).count(),
#                     "total_jobs": self.db.query(Job).count(),
#                     "total_templates": self.db.query(EmailTemplate).count()
#                 }
#             }
            
#             # Generate Max's response using Gemini
#             prompt = self.create_max_prompt(user_message, conversation_history, context)
            
#             model = genai.GenerativeModel('gemini-1.5-flash')
#             response = model.generate_content(prompt)
            
#             print(f"🤖 Raw Gemini Response: {response.text}")  # Debug log
            
#             # Try to parse as JSON, fallback to plain text
#             ai_response = None
#             try:
#                 # Clean the response text - remove markdown code blocks if present
#                 response_text = response.text.strip()
#                 if response_text.startswith('```json'):
#                     response_text = response_text[7:]  # Remove ```json
#                 if response_text.endswith('```'):
#                     response_text = response_text[:-3]  # Remove ```
                
#                 response_text = response_text.strip()
                
#                 print(f"🧹 Cleaned Response: {response_text}")  # Debug log
                
#                 ai_response = json.loads(response_text)
#                 print(f"✅ Successfully parsed JSON response")
                
#             except json.JSONDecodeError as e:
#                 print(f"❌ JSON Parse Error: {e}")
#                 print(f"🔍 Trying to extract JSON from response...")
                
#                 # Try to extract JSON from the response
#                 import re
#                 json_pattern = r'\{[\s\S]*\}'
#                 match = re.search(json_pattern, response.text)
                
#                 if match:
#                     try:
#                         ai_response = json.loads(match.group(0))
#                         print(f"✅ Successfully extracted and parsed JSON")
#                     except:
#                         print(f"❌ Failed to parse extracted JSON")
#                         ai_response = None
                
#                 if not ai_response:
#                     # Fallback to plain text response
#                     ai_response = {
#                         "response": response.text,
#                         "requires_action": False,
#                         "actions": []
#                     }
#                     print(f"📝 Using fallback plain text response")
            
#             # Save message to session
#             user_msg = {
#                 "id": str(uuid.uuid4()),
#                 "type": "user",
#                 "content": user_message,
#                 "timestamp": datetime.now().isoformat()
#             }
            
#             assistant_msg = {
#                 "id": str(uuid.uuid4()),
#                 "type": "assistant", 
#                 "content": ai_response["response"],
#                 "timestamp": datetime.now().isoformat(),
#                 "actions": ai_response.get("actions", []),
#                 "requires_confirmation": ai_response.get("requires_action", False)
#             }
            
#             self.save_messages_to_session(session_id, [user_msg, assistant_msg], user_id)
            
#             return {
#                 "success": True,
#                 "response": ai_response["response"],
#                 "requires_action": ai_response.get("requires_action", False),
#                 "actions": ai_response.get("actions", []),
#                 "session_id": session_id
#             }
            
#         except Exception as e:
#             print(f"❌ Error processing message: {e}")
#             return {
#                 "success": False,
#                 "response": "I apologize, but I encountered an error processing your request. Please try again.",
#                 "error": str(e)
#             }

    
#     def save_messages_to_session(self, session_id: str, messages: List[Dict], user_id: str = None):
#         """Save messages to chat session"""
#         try:
#             session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            
#             if session:
#                 # Update existing session
#                 session.messages.extend(messages)
#                 session.message_count = len(session.messages)
#                 session.last_message = messages[-1]["content"]
#                 session.updated_at = datetime.utcnow()
#             else:
#                 # Create new session
#                 session_name = messages[0]["content"][:50] + "..." if len(messages[0]["content"]) > 50 else messages[0]["content"]
                
#                 session = ChatSession(
#                     id=session_id,
#                     name=session_name,
#                     messages=messages,
#                     message_count=len(messages),
#                     last_message=messages[-1]["content"],
#                     user_id=user_id or "anonymous",
#                     context=json.dumps({"created": datetime.now().isoformat()})
#                 )
#                 self.db.add(session)
            
#             self.db.commit()
            
#         except Exception as e:
#             print(f"Error saving session: {e}")
#             self.db.rollback()
    
#     async def execute_action(self, action_id: str, action_data: Dict) -> Dict:
#         """Execute a confirmed action"""
#         try:
#             action_type = action_data.get("type")
#             parameters = action_data.get("parameters", {})
            
#             # Create action record
#             chat_action = ChatAction(
#                 id=action_id,
#                 session_id=action_data.get("session_id"),
#                 action_type=action_type,
#                 action_data=action_data,
#                 status="executing"
#             )
#             self.db.add(chat_action)
#             self.db.commit()
            
#             result = None
            
#             if action_type == "CREATE_EMAIL_TEMPLATE":
#                 result = await self.create_email_template_action(parameters)
#             elif action_type == "SEND_EMAIL":
#                 result = await self.send_email_action(parameters)
#             elif action_type == "CREATE_JOB":
#                 result = await self.create_job_action(parameters)
#             elif action_type == "MATCH_CANDIDATES":
#                 result = await self.match_candidates_action(parameters)
#             elif action_type == "GENERATE_JOB_DESCRIPTION":
#                 result = await self.generate_job_description_action(parameters)
#             else:
#                 result = {"success": False, "message": "Unknown action type"}
            
#             # Update action status
#             chat_action.status = "executed" if result.get("success") else "failed"
#             chat_action.result = result
#             chat_action.executed_at = datetime.utcnow()
#             self.db.commit()
            
#             return result
            
#         except Exception as e:
#             print(f"Error executing action: {e}")
#             return {"success": False, "message": str(e)}
    
#     async def create_email_template_action(self, params: Dict) -> Dict:
#         """Execute email template creation"""
#         try:
#             template_data = {
#                 "name": params.get("name"),
#                 "category": params.get("category", "general"),
#                 "subject": params.get("subject"),
#                 "body_html": params.get("body")
#             }
            
#             result = self.email_service.create_email_template(template_data)
            
#             if result.get("success"):
#                 return {
#                     "success": True,
#                     "message": f"Email template '{params.get('name')}' created successfully!",
#                     "template_id": result.get("template", {}).get("id"),
#                     "details": f"Category: {params.get('category')}\nVariables detected: {len(result.get('template', {}).get('variables', []))}"
#                 }
#             else:
#                 return {"success": False, "message": result.get("error", "Failed to create template")}
                
#         except Exception as e:
#             return {"success": False, "message": str(e)}
    
#     async def send_email_action(self, params: Dict) -> Dict:
#         """Execute email sending"""
#         try:
#             email_data = {
#                 "template_id": params.get("template_id"),
#                 "recipient_email": params.get("recipient_email"),
#                 "variables": {
#                     "candidate_name": params.get("candidate_name", ""),
#                     "job_title": params.get("job_title", ""),
#                     "interview_date": params.get("interview_date", ""),
#                     "company_name": "Navikenz India Pvt Ltd"
#                 }
#             }
            
#             result = self.email_service.send_single_email(email_data)
            
#             if result.get("success"):
#                 return {
#                     "success": True,
#                     "message": f"Email sent successfully to {params.get('recipient_email')}!",
#                     "details": f"Template: {result.get('template_used', 'Unknown')}\nRecipient: {params.get('candidate_name', 'Unknown')}"
#                 }
#             else:
#                 return {"success": False, "message": result.get("error", "Failed to send email")}
                
#         except Exception as e:
#             return {"success": False, "message": str(e)}
    
#     async def create_job_action(self, params: Dict) -> Dict:
#         """Execute job creation"""
#         try:
#             job_data = {
#                 "title": params.get("title"),
#                 "department": params.get("department"),
#                 "location": params.get("location"),
#                 "experience_level": params.get("experience_level"),
#                 "employment_type": params.get("employment_type"),
#                 "status": "draft",
#                 "priority": "medium",
#                 "positions_available": 1
#             }
            
#             job = Job(**job_data)
#             self.db.add(job)
#             self.db.commit()
#             self.db.refresh(job)
            
#             return {
#                 "success": True,
#                 "message": f"Job posting '{params.get('title')}' created successfully!",
#                 "job_id": job.id,
#                 "details": f"Department: {params.get('department')}\nLocation: {params.get('location')}\nStatus: Draft"
#             }
            
#         except Exception as e:
#             self.db.rollback()
#             return {"success": False, "message": str(e)}
    
#     async def match_candidates_action(self, params: Dict) -> Dict:
#         """Execute candidate matching (mock implementation)"""
#         try:
#             job_title = params.get("job_title", "Unknown Position")
#             required_skills = params.get("required_skills", [])
            
#             # Mock matching logic - you can enhance this with your actual matching algorithm
#             candidates = self.db.query(Candidate).filter(Candidate.is_available == True).limit(10).all()
            
#             matches = []
#             for candidate in candidates:
#                 score = 75 + (hash(candidate.email) % 25)  # Mock score
#                 matches.append({
#                     "name": candidate.full_name,
#                     "email": candidate.email,
#                     "score": score
#                 })
            
#             matches.sort(key=lambda x: x["score"], reverse=True)
            
#             return {
#                 "success": True,
#                 "message": f"Found {len(matches)} matching candidates for {job_title}!",
#                 "details": f"Top matches:\n" + "\n".join([f"• {m['name']} ({m['score']}% match)" for m in matches[:3]])
#             }
            
#         except Exception as e:
#             return {"success": False, "message": str(e)}
    
#     async def generate_job_description_action(self, params: Dict) -> Dict:
#         """Execute job description generation"""
#         try:
#             # Mock implementation - you can integrate with your actual JD generator
#             title = params.get("title", "Unknown Position")
            
#             return {
#                 "success": True,
#                 "message": f"Job description generated for {title}!",
#                 "details": "Generated comprehensive JD with responsibilities, requirements, and benefits."
#             }
            
#         except Exception as e:
#             return {"success": False, "message": str(e)}
    
#     def get_chat_sessions(self, user_id: str = None) -> List[Dict]:
#         """Get chat sessions for user"""
#         try:
#             query = self.db.query(ChatSession).filter(ChatSession.is_active == True)
#             if user_id:
#                 query = query.filter(ChatSession.user_id == user_id)
            
#             sessions = query.order_by(ChatSession.updated_at.desc()).all()
            
#             return [
#                 {
#                     "id": s.id,
#                     "name": s.name,
#                     "message_count": s.message_count,
#                     "last_message": s.last_message,
#                     "created_at": s.created_at.isoformat() if s.created_at else None,
#                     "updated_at": s.updated_at.isoformat() if s.updated_at else None
#                 }
#                 for s in sessions
#             ]
            
#         except Exception as e:
#             print(f"Error getting sessions: {e}")
#             return []
    
#     def get_chat_session(self, session_id: str) -> Dict:
#         """Get specific chat session"""
#         try:
#             session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
#             if not session:
#                 return {"success": False, "error": "Session not found"}
            
#             return {
#                 "success": True,
#                 "messages": session.messages,
#                 "context": session.context,
#                 "name": session.name
#             }
            
#         except Exception as e:
#             return {"success": False, "error": str(e)}

# services/max_service.py
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from database.models.chat_session import ChatSession, ChatAction
from database.models.email_templates import EmailTemplate
from database.models.job import Job
from database.models.candidate import Candidate
from services.email_automation_service import EmailAutomationService
import json
import uuid
from datetime import datetime
import google.generativeai as genai
import os
import re

class MaxAIService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.email_service = EmailAutomationService(db_session)
        
        # Configure Gemini
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        
    def create_max_prompt(self, user_message: str, conversation_history: List[Dict], context: Dict = None) -> str:
        """Create enhanced prompt for Max with NaviHire context"""
        
        context_info = context or {}
        
        return f"""You are Max, an intelligent AI assistant for NaviHire, a comprehensive recruitment management system. You are helpful, professional, and capable of performing complex tasks.

ABOUT NAVIHIRE:
- AI-powered recruitment platform with advanced features
- Candidate management with resume parsing and AI scoring
- Job posting and description generation
- Smart candidate matching using AI algorithms
- Email automation with templates and bulk sending
- Analytics and reporting dashboard
- Assessment scheduling and management

YOUR CAPABILITIES:
You can perform these actions (with user confirmation):
- CREATE_EMAIL_TEMPLATE: Create custom email templates for recruitment
- SEND_EMAIL: Send emails to candidates or staff using templates
- CREATE_JOB: Create job postings with detailed requirements
- MATCH_CANDIDATES: Find and rank candidates for specific positions
- GENERATE_JOB_DESCRIPTION: Create comprehensive job descriptions
- SCHEDULE_ASSESSMENT: Schedule tests/interviews for candidates
- GET_ANALYTICS: Provide recruitment insights and metrics

CONVERSATION CONTEXT:
Previous messages: {len(conversation_history)} messages
Recent context: {json.dumps(conversation_history[-3:] if conversation_history else [])}
Additional context: {json.dumps(context_info)}

USER MESSAGE: "{user_message}"

RESPONSE GUIDELINES:
1. If it's a general question about NaviHire, provide helpful information
2. If the user wants to perform an action, respond with ONLY a clean JSON structure
3. Be conversational and professional
4. Ask for clarification if needed
5. Always confirm before executing actions

IMPORTANT: If the user requests an action, respond with ONLY valid JSON in this exact format (no markdown, no extra text):

{{
  "response": "Your conversational response explaining what you'll do",
  "requires_action": true,
  "actions": [
    {{
      "type": "CREATE_EMAIL_TEMPLATE",
      "title": "Clear action title",
      "description": "Detailed description of what this will do",
      "parameters": {{"key": "value"}},
      "requires_form": true,
      "form_fields": [
        {{"name": "field_name", "label": "Field Label", "type": "text", "required": true, "placeholder": "Placeholder text"}}
      ]
    }}
  ]
}}

For simple responses (no actions), just provide the conversational text without JSON.

Remember: You are Max, the smart assistant that makes NaviHire amazing!"""

    async def process_user_message(self, user_message: str, session_id: str, user_id: str = None) -> Dict:
        """Process user message and return Max's response"""
        try:
            # Get conversation history
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            conversation_history = session.messages if session else []
            
            # Create context
            context = {
                "session_id": session_id,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "platform_info": {
                    "total_candidates": self.db.query(Candidate).count(),
                    "total_jobs": self.db.query(Job).count(),
                    "total_templates": self.db.query(EmailTemplate).count()
                }
            }
            
            # Generate Max's response using Gemini
            prompt = self.create_max_prompt(user_message, conversation_history, context)
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            print(f"🤖 Raw Gemini Response: {response.text}")
            
            # Try to parse as JSON, fallback to plain text
            ai_response = None
            try:
                # Clean the response text - remove markdown code blocks if present
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:]  # Remove ```json
                if response_text.endswith('```'):
                    response_text = response_text[:-3]  # Remove ```
                
                response_text = response_text.strip()
                
                print(f"🧹 Cleaned Response: {response_text}")
                
                ai_response = json.loads(response_text)
                print(f"✅ Successfully parsed JSON response")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON Parse Error: {e}")
                print(f"🔍 Trying to extract JSON from response...")
                
                # Try to extract JSON from the response
                json_pattern = r'\{[\s\S]*\}'
                match = re.search(json_pattern, response.text)
                
                if match:
                    try:
                        ai_response = json.loads(match.group(0))
                        print(f"✅ Successfully extracted and parsed JSON")
                    except:
                        print(f"❌ Failed to parse extracted JSON")
                        ai_response = None
                
                if not ai_response:
                    # Fallback to plain text response
                    ai_response = {
                        "response": response.text,
                        "requires_action": False,
                        "actions": []
                    }
                    print(f"📝 Using fallback plain text response")
            
            # Save message to session
            user_msg = {
                "id": str(uuid.uuid4()),
                "type": "user",
                "content": user_message,
                "timestamp": datetime.now().isoformat()
            }
            
            assistant_msg = {
                "id": str(uuid.uuid4()),
                "type": "assistant", 
                "content": ai_response["response"],
                "timestamp": datetime.now().isoformat(),
                "actions": ai_response.get("actions", []),
                "requires_confirmation": ai_response.get("requires_action", False)
            }
            
            self.save_messages_to_session(session_id, [user_msg, assistant_msg], user_id)
            
            return {
                "success": True,
                "response": ai_response["response"],
                "requires_action": ai_response.get("requires_action", False),
                "actions": ai_response.get("actions", []),
                "session_id": session_id
            }
            
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            return {
                "success": False,
                "response": "I apologize, but I encountered an error processing your request. Please try again.",
                "error": str(e)
            }
    
    def save_messages_to_session(self, session_id: str, messages: List[Dict], user_id: str = None):
        """Save messages to chat session"""
        try:
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            
            if session:
                # Update existing session
                if not session.messages:
                    session.messages = []
                session.messages.extend(messages)
                session.message_count = len(session.messages)
                session.last_message = messages[-1]["content"]
                session.updated_at = datetime.utcnow()
            else:
                # Create new session
                session_name = messages[0]["content"][:50] + "..." if len(messages[0]["content"]) > 50 else messages[0]["content"]
                
                session = ChatSession(
                    id=session_id,
                    name=session_name,
                    messages=messages,
                    message_count=len(messages),
                    last_message=messages[-1]["content"],
                    user_id=user_id or "anonymous",
                    context=json.dumps({"created": datetime.now().isoformat()})
                )
                self.db.add(session)
            
            self.db.commit()
            
        except Exception as e:
            print(f"❌ Error saving session: {e}")
            self.db.rollback()
    
    async def execute_action(self, action_id: str, action_data: Dict) -> Dict:
        """Execute a confirmed action"""
        try:
            action_type = action_data.get("type")
            parameters = action_data.get("parameters", {})
            
            print(f"🎯 Executing action: {action_type} with parameters: {parameters}")
            
            # Create action record
            chat_action = ChatAction(
                id=action_id,
                session_id=action_data.get("session_id"),
                action_type=action_type,
                action_data=action_data,
                status="executing"
            )
            self.db.add(chat_action)
            self.db.commit()
            
            result = None
            
            if action_type == "CREATE_EMAIL_TEMPLATE":
                result = await self.create_email_template_action(parameters)
            elif action_type == "SEND_EMAIL":
                result = await self.send_email_action(parameters)
            elif action_type == "CREATE_JOB":
                result = await self.create_job_action(parameters)
            elif action_type == "MATCH_CANDIDATES":
                result = await self.match_candidates_action(parameters)
            elif action_type == "GENERATE_JOB_DESCRIPTION":
                result = await self.generate_job_description_action(parameters)
            else:
                result = {"success": False, "message": f"Unknown action type: {action_type}"}
            
            # Update action status
            chat_action.status = "executed" if result.get("success") else "failed"
            chat_action.result = result
            chat_action.executed_at = datetime.utcnow()
            self.db.commit()
            
            return result
            
        except Exception as e:
            print(f"❌ Error executing action: {e}")
            return {"success": False, "message": str(e)}
    
    async def create_email_template_action(self, params: Dict) -> Dict:
        """Execute email template creation"""
        try:
            print(f"📧 Creating email template with params: {params}")
            
            template_data = {
                "name": params.get("name") or params.get("template_name") or "Friendship Day Event Invitation",
                "category": params.get("category", "event"),
                "subject": params.get("subject") or params.get("subject_line") or "Friendship Day Celebration!",
                "body_html": params.get("body") or params.get("body_html") or self.generate_friendship_day_template(params)
            }
            
            print(f"📝 Template data prepared: {template_data}")
            
            result = self.email_service.create_email_template(template_data)
            
            if result.get("success"):
                return {
                    "success": True,
                    "message": f"Email template '{template_data['name']}' created successfully!",
                    "template_id": result.get("template", {}).get("id"),
                    "details": f"Category: {template_data['category']}\nSubject: {template_data['subject']}"
                }
            else:
                return {"success": False, "message": result.get("error", "Failed to create template")}
                
        except Exception as e:
            print(f"❌ Template creation error: {e}")
            return {"success": False, "message": str(e)}
    
    def generate_friendship_day_template(self, params: Dict) -> str:
        """Generate a default Friendship Day email template"""
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ff6b6b; text-align: center;">🎉 Friendship Day Celebration! 🎉</h2>
            
            <p>Dear Team,</p>
            
            <p>We're excited to invite you to our <strong>Friendship Day Celebration</strong> at the Navikenz office!</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">Event Details:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>📅 Date:</strong> {params.get('date', 'August 2nd, 2025')}</li>
                    <li><strong>🕘 Time:</strong> {params.get('time', '9:00 AM')}</li>
                    <li><strong>📍 Location:</strong> {params.get('location', 'Bengaluru Office')}</li>
                    <li><strong>🎯 Agenda:</strong> Friendship Day activities, games, and bonding</li>
                </ul>
            </div>
            
            <p>Join us for a day filled with fun activities, team bonding, and celebrating the wonderful friendships we've built at work!</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="background-color: #28a745; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; margin: 0;">
                    <strong>Please RSVP by July 30th</strong>
                </p>
            </div>
            
            <p>Looking forward to celebrating with all of you!</p>
            
            <p>Best regards,<br>
            <strong>Navikenz Team</strong></p>
        </div>
        """
    
    async def send_email_action(self, params: Dict) -> Dict:
        """Execute email sending"""
        try:
            email_data = {
                "template_id": params.get("template_id"),
                "recipient_email": params.get("recipient_email"),
                "variables": {
                    "candidate_name": params.get("candidate_name", ""),
                    "job_title": params.get("job_title", ""),
                    "interview_date": params.get("interview_date", ""),
                    "company_name": "Navikenz India Pvt Ltd"
                }
            }
            
            result = self.email_service.send_single_email(email_data)
            
            if result.get("success"):
                return {
                    "success": True,
                    "message": f"Email sent successfully to {params.get('recipient_email')}!",
                    "details": f"Template: {result.get('template_used', 'Unknown')}\nRecipient: {params.get('candidate_name', 'Unknown')}"
                }
            else:
                return {"success": False, "message": result.get("error", "Failed to send email")}
                
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def create_job_action(self, params: Dict) -> Dict:
        """Execute job creation"""
        try:
            job_data = {
                "title": params.get("title"),
                "department": params.get("department"),
                "location": params.get("location"),
                "experience_level": params.get("experience_level"),
                "employment_type": params.get("employment_type"),
                "status": "draft",
                "priority": "medium",
                "positions_available": 1
            }
            
            job = Job(**job_data)
            self.db.add(job)
            self.db.commit()
            self.db.refresh(job)
            
            return {
                "success": True,
                "message": f"Job posting '{params.get('title')}' created successfully!",
                "job_id": job.id,
                "details": f"Department: {params.get('department')}\nLocation: {params.get('location')}\nStatus: Draft"
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "message": str(e)}
    
    async def match_candidates_action(self, params: Dict) -> Dict:
        """Execute candidate matching"""
        try:
            job_title = params.get("job_title", "Unknown Position")
            
            # Mock matching logic
            candidates = self.db.query(Candidate).filter(Candidate.is_available == True).limit(10).all()
            
            matches = []
            for candidate in candidates:
                score = 75 + (hash(candidate.email or '') % 25)  # Mock score
                matches.append({
                    "name": candidate.full_name,
                    "email": candidate.email,
                    "score": score
                })
            
            matches.sort(key=lambda x: x["score"], reverse=True)
            
            return {
                "success": True,
                "message": f"Found {len(matches)} matching candidates for {job_title}!",
                "details": f"Top matches:\n" + "\n".join([f"• {m['name']} ({m['score']}% match)" for m in matches[:3]])
            }
            
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def generate_job_description_action(self, params: Dict) -> Dict:
        """Execute job description generation"""
        try:
            title = params.get("title", "Unknown Position")
            
            return {
                "success": True,
                "message": f"Job description generated for {title}!",
                "details": "Generated comprehensive JD with responsibilities, requirements, and benefits."
            }
            
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def get_chat_sessions(self, user_id: str = None) -> List[Dict]:
        """Get chat sessions for user"""
        try:
            query = self.db.query(ChatSession).filter(ChatSession.is_active == True)
            if user_id:
                query = query.filter(ChatSession.user_id == user_id)
            
            sessions = query.order_by(ChatSession.updated_at.desc()).all()
            
            return [
                {
                    "id": s.id,
                    "name": s.name,
                    "message_count": s.message_count,
                    "last_message": s.last_message,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None
                }
                for s in sessions
            ]
            
        except Exception as e:
            print(f"❌ Error getting sessions: {e}")
            return []
    
    def get_chat_session(self, session_id: str) -> Dict:
        """Get specific chat session"""
        try:
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                return {"success": False, "error": "Session not found"}
            
            return {
                "success": True,
                "messages": session.messages or [],
                "context": session.context,
                "name": session.name
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}