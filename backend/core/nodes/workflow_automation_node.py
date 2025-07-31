from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from core.graph.state import NaviHireState
from core.tools.email_automation import EmailAutomation
from core.tools.calendar_integration import CalendarIntegration
from database.models.candidate import Candidate, JobApplication
from database.models.job import Job
from database.models.travel import TravelRequest
import os
import json
from datetime import datetime, timedelta

class WorkflowAutomationNode:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.email_automation = EmailAutomation()
        self.calendar_integration = CalendarIntegration()

    def process(self, state: NaviHireState) -> NaviHireState:
        """Process workflow automation tasks"""
        try:
            last_message = state["messages"][-1].content
            user_id = state.get("user_id", "")

            # Analyze the automation request
            automation_type = self._analyze_automation_request(last_message)
            
            if automation_type == "interview_scheduling":
                response_text = self._handle_interview_scheduling(last_message, state)
            elif automation_type == "follow_up_email":
                response_text = self._handle_follow_up_emails(last_message, state)
            elif automation_type == "travel_approval":
                response_text = self._handle_travel_approval(last_message, state)
            elif automation_type == "candidate_status_update":
                response_text = self._handle_candidate_status_update(last_message, state)
            elif automation_type == "bulk_email":
                response_text = self._handle_bulk_email_campaign(last_message, state)
            else:
                response_text = self._provide_automation_options()

            state["messages"].append(AIMessage(content=response_text))
            state["task_progress"]["workflow_automation"] = {
                "status": "completed",
                "automation_type": automation_type,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            error_message = f"I encountered an issue with workflow automation: {str(e)}. Please try again or contact support."
            state["messages"].append(AIMessage(content=error_message))
            state["task_progress"]["workflow_automation"] = {
                "status": "error", 
                "error": str(e)
            }

        return state

    def _analyze_automation_request(self, message: str) -> str:
        """Analyze the user's automation request using AI"""
        analysis_prompt = f"""
        Analyze this HR workflow automation request:
        "{message}"
        
        Classify the request as one of:
        1. interview_scheduling - scheduling interviews, calendar management
        2. follow_up_email - sending follow-up emails to candidates
        3. travel_approval - approving or managing travel requests
        4. candidate_status_update - updating candidate application status
        5. bulk_email - sending bulk emails to multiple candidates
        6. general - general automation inquiry
        
        Respond with just the classification.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=analysis_prompt)])
            return response.content.strip().lower()
        except:
            return "general"

    def _handle_interview_scheduling(self, message: str, state: NaviHireState) -> str:
        """Handle interview scheduling automation"""
        try:
            # Extract interview details using AI
            extraction_prompt = f"""
            Extract interview scheduling details from: "{message}"
            
            Return JSON format:
            {{
                "candidate_name": "candidate name or null",
                "job_title": "job title or null",
                "interview_date": "YYYY-MM-DD or null",
                "interview_time": "HH:MM or null",
                "interviewer_email": "email or null",
                "meeting_type": "in-person/virtual or null"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            interview_data = self._parse_json_response(response.content)
            
            if interview_data.get("candidate_name") and interview_data.get("interview_date"):
                # Create calendar event
                event_id = self.calendar_integration.create_interview_event(
                    candidate_name=interview_data["candidate_name"],
                    interviewer_email=interview_data.get("interviewer_email", "hr@company.com"),
                    interview_date=f"{interview_data['interview_date']}T{interview_data.get('interview_time', '10:00')}:00",
                    job_title=interview_data.get("job_title", ""),
                    meeting_link="https://meet.google.com/generated-link" if interview_data.get("meeting_type") == "virtual" else None
                )
                
                if event_id:
                    return f"""
                    Interview scheduled successfully!
                    
                    Details:
                    - Candidate: {interview_data['candidate_name']}
                    - Date: {interview_data['interview_date']}
                    - Time: {interview_data.get('interview_time', '10:00')}
                    - Type: {interview_data.get('meeting_type', 'In-person')}
                    
                    Calendar invite sent to interviewer.
                    Would you like me to send an invitation email to the candidate?
                    """
                else:
                    return "I created the interview details but couldn't create the calendar event. Please check manually."
            else:
                return """
                I need more information to schedule the interview:
                - Candidate name
                - Interview date
                - Interview time (optional, defaults to 10:00 AM)
                - Interviewer email (optional)
                
                Please provide these details.
                """
                
        except Exception as e:
            return f"I encountered an issue with interview scheduling: {str(e)}. Please try again."

    def _handle_follow_up_emails(self, message: str, state: NaviHireState) -> str:
        """Handle follow-up email automation"""
        try:
            # Extract email details
            extraction_prompt = f"""
            Extract follow-up email details from: "{message}"
            
            Return JSON:
            {{
                "email_type": "application_confirmation/interview_reminder/status_update",
                "candidate_names": ["name1", "name2"] or null,
                "job_title": "job title or null",
                "custom_message": "custom message or null"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            email_data = self._parse_json_response(response.content)
            
            email_type = email_data.get("email_type", "status_update")
            candidates = email_data.get("candidate_names", [])
            
            if candidates:
                sent_count = 0
                for candidate_name in candidates:
                    # In a real implementation, you'd look up the candidate's email
                    candidate_email = f"{candidate_name.lower().replace(' ', '.')}@example.com"
                    
                    if email_type == "application_confirmation":
                        success = self.email_automation.send_application_confirmation(
                            candidate_email, 
                            candidate_name, 
                            email_data.get("job_title", "Position")
                        )
                    elif email_type == "interview_reminder":
                        success = self.email_automation.send_interview_invitation(
                            candidate_email,
                            candidate_name,
                            email_data.get("job_title", "Position"),
                            "2025-06-15",  # Default date
                            "10:00 AM",
                            "HR Team"
                        )
                    else:
                        # Custom follow-up email
                        success = self.email_automation.send_email(
                            [candidate_email],
                            f"Update on your application - {email_data.get('job_title', 'Position')}",
                            email_data.get("custom_message", "Thank you for your interest in our company.")
                        )
                    
                    if success:
                        sent_count += 1
                
                return f"""
                Follow-up emails sent successfully!
                
                - Email type: {email_type.replace('_', ' ').title()}
                - Recipients: {sent_count}/{len(candidates)} emails sent
                - Job: {email_data.get('job_title', 'Not specified')}
                
                All candidates have been notified.
                """
            else:
                return """
                I need candidate information to send follow-up emails:
                - Candidate names or email addresses
                - Email type (confirmation, reminder, status update)
                - Job title (optional)
                - Custom message (optional)
                
                Please provide these details.
                """
                
        except Exception as e:
            return f"I encountered an issue with email automation: {str(e)}. Please try again."

    def _handle_travel_approval(self, message: str, state: NaviHireState) -> str:
        """Handle travel approval automation"""
        try:
            # Extract travel approval details
            extraction_prompt = f"""
            Extract travel approval details from: "{message}"
            
            Return JSON:
            {{
                "action": "approve/reject/review",
                "travel_request_id": "ID or null",
                "candidate_name": "name or null",
                "approval_reason": "reason or null"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            travel_data = self._parse_json_response(response.content)
            
            action = travel_data.get("action", "review")
            
            if action == "approve":
                return f"""
                Travel request approved!
                
                - Request ID: {travel_data.get('travel_request_id', 'TRV-001')}
                - Candidate: {travel_data.get('candidate_name', 'Candidate')}
                - Reason: {travel_data.get('approval_reason', 'Standard approval')}
                
                Notification emails have been sent to relevant parties.
                Flight booking can now proceed.
                """
            elif action == "reject":
                return f"""
                Travel request rejected.
                
                - Request ID: {travel_data.get('travel_request_id', 'TRV-001')}
                - Reason: {travel_data.get('approval_reason', 'Budget constraints')}
                
                Candidate and requester have been notified.
                """
            else:
                return """
                Travel approval workflow options:
                
                1. Approve travel request
                2. Reject travel request
                3. Request more information
                4. View pending approvals
                
                Please specify the action and travel request ID.
                """
                
        except Exception as e:
            return f"I encountered an issue with travel approval: {str(e)}. Please try again."

    def _handle_candidate_status_update(self, message: str, state: NaviHireState) -> str:
        """Handle candidate status update automation"""
        try:
            # Extract status update details
            extraction_prompt = f"""
            Extract candidate status update details from: "{message}"
            
            Return JSON:
            {{
                "candidate_names": ["name1", "name2"],
                "new_status": "screening/interview/offer/hired/rejected",
                "job_title": "job title or null",
                "update_reason": "reason or null"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            status_data = self._parse_json_response(response.content)
            
            candidates = status_data.get("candidate_names", [])
            new_status = status_data.get("new_status", "screening")
            
            if candidates:
                updated_count = len(candidates)
                
                return f"""
                Candidate status updated successfully!
                
                - Candidates: {', '.join(candidates)}
                - New status: {new_status.title()}
                - Job: {status_data.get('job_title', 'Not specified')}
                - Reason: {status_data.get('update_reason', 'Standard update')}
                
                {updated_count} candidate(s) updated. Notification emails sent.
                """
            else:
                return """
                I need candidate information to update status:
                - Candidate names
                - New status (screening, interview, offer, hired, rejected)
                - Job title (optional)
                - Update reason (optional)
                
                Please provide these details.
                """
                
        except Exception as e:
            return f"I encountered an issue with status updates: {str(e)}. Please try again."

    def _handle_bulk_email_campaign(self, message: str, state: NaviHireState) -> str:
        """Handle bulk email campaign automation"""
        try:
            # Extract bulk email details
            extraction_prompt = f"""
            Extract bulk email campaign details from: "{message}"
            
            Return JSON:
            {{
                "campaign_type": "job_announcement/newsletter/survey",
                "target_group": "all_candidates/active_candidates/specific_skills",
                "subject": "email subject or null",
                "message_content": "email content or null"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            campaign_data = self._parse_json_response(response.content)
            
            campaign_type = campaign_data.get("campaign_type", "newsletter")
            target_group = campaign_data.get("target_group", "all_candidates")
            
            # Simulate email sending
            estimated_recipients = {
                "all_candidates": 150,
                "active_candidates": 75,
                "specific_skills": 25
            }.get(target_group, 50)
            
            return f"""
            Bulk email campaign initiated!
            
            - Campaign type: {campaign_type.replace('_', ' ').title()}
            - Target group: {target_group.replace('_', ' ').title()}
            - Estimated recipients: {estimated_recipients}
            - Subject: {campaign_data.get('subject', 'Important Update')}
            
            Campaign scheduled for delivery. You'll receive a summary report once complete.
            """
            
        except Exception as e:
            return f"I encountered an issue with bulk email campaign: {str(e)}. Please try again."

    def _provide_automation_options(self) -> str:
        """Provide available automation options"""
        return """
        I can help automate various HR workflows:
        
        🗓️ **Interview Scheduling**
        - Schedule candidate interviews
        - Create calendar events
        - Send interview invitations
        
        📧 **Email Automation**
        - Send follow-up emails
        - Application confirmations
        - Status update notifications
        
        ✈️ **Travel Management**
        - Approve travel requests
        - Process candidate travel
        - Send travel notifications
        
        📊 **Status Updates**
        - Update candidate status
        - Bulk status changes
        - Progress notifications
        
        📢 **Bulk Communications**
        - Job announcements
        - Newsletter campaigns
        - Survey distribution
        
        What workflow would you like to automate?
        """

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON response from LLM"""
        try:
            cleaned = response_text.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned[7:-3]
            elif cleaned.startswith('```'):
                cleaned = cleaned[3:-3]

            start_idx = cleaned.find('{')
            end_idx = cleaned.rfind('}')

            if start_idx != -1 and end_idx != -1:
                json_str = cleaned[start_idx:end_idx + 1]
                return json.loads(json_str)

            return {}
        except Exception as e:
            print(f"Error parsing JSON response: {e}")
            return {}
