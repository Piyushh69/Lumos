from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from database.models.scheduled_email import ScheduledEmail, EmailDeliveryLog
from database.models.email_templates import EmailTemplate
from database.models.candidate import Candidate, JobApplication
from database.models.job import Job
from services.email_automation_service import EmailAutomationService
import json
import uuid
from datetime import datetime, timedelta
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger
import asyncio
import logging
from sqlalchemy import func

logger = logging.getLogger(__name__)

class EmailSchedulerService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.email_service = EmailAutomationService(db_session)
        self.scheduler = AsyncIOScheduler()
        self.scheduler.start()
        
        # Load pending scheduled emails on startup
        self._load_pending_schedules()
    
    def _load_pending_schedules(self):
        """Load pending scheduled emails and add them to scheduler"""
        try:
            pending_emails = self.db.query(ScheduledEmail).filter(
                ScheduledEmail.status == "scheduled",
                ScheduledEmail.scheduled_at > datetime.utcnow()
            ).all()
            
            for email in pending_emails:
                self._schedule_email_job(email)
                
            logger.info(f"✅ Loaded {len(pending_emails)} pending email schedules")
            
        except Exception as e:
            logger.error(f"❌ Error loading pending schedules: {e}")
    
    def create_scheduled_email(self, schedule_data: Dict) -> Dict:
        """Create a new scheduled email"""
        try:
            # Validate required fields
            required_fields = ["name", "template_id", "category", "scheduled_at", "recipients"]
            for field in required_fields:
                if field not in schedule_data:
                    return {"success": False, "error": f"Missing required field: {field}"}
            
            # Process recipients
            recipients_data = self._process_recipients(
                schedule_data["recipients"], 
                schedule_data["category"]
            )
            
            if not recipients_data:
                return {"success": False, "error": "No valid recipients found"}
            
            # Parse scheduled time
            scheduled_at = self._parse_scheduled_time(
                schedule_data["scheduled_at"], 
                schedule_data.get("timezone", "Asia/Kolkata")
            )
            
            # Create scheduled email record
            scheduled_email = ScheduledEmail(
                name=schedule_data["name"],
                template_id=schedule_data["template_id"],
                category=schedule_data["category"],
                scheduled_at=scheduled_at,
                priority=schedule_data.get("priority", "medium"),
                recipients=recipients_data,
                recipient_count=len(recipients_data),
                subject_override=schedule_data.get("subject_override"),
                variables=schedule_data.get("variables", {}),
                is_recurring=schedule_data.get("is_recurring", False),
                recurrence_pattern=schedule_data.get("recurrence_pattern"),
                timezone=schedule_data.get("timezone", "Asia/Kolkata"),
                created_by=schedule_data.get("created_by", 1),
                status="scheduled"
            )
            
            self.db.add(scheduled_email)
            self.db.commit()
            self.db.refresh(scheduled_email)
            
            # Schedule the job
            self._schedule_email_job(scheduled_email)
            
            logger.info(f"📅 Email scheduled: {scheduled_email.name} for {scheduled_at}")
            
            return {
                "success": True,
                "scheduled_email": {
                    "id": scheduled_email.id,
                    "name": scheduled_email.name,
                    "category": scheduled_email.category,
                    "scheduled_at": scheduled_at.isoformat(),
                    "recipient_count": len(recipients_data),
                    "status": "scheduled"
                },
                "message": f"Email '{scheduled_email.name}' scheduled successfully for {scheduled_at.strftime('%B %d, %Y at %H:%M')}"
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating scheduled email: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}
    
    def _schedule_email_job(self, scheduled_email: ScheduledEmail):
        """Schedule email job with APScheduler"""
        try:
            job_id = f"email_schedule_{scheduled_email.id}"
            
            if scheduled_email.is_recurring and scheduled_email.recurrence_pattern:
                # Handle recurring emails
                pattern = scheduled_email.recurrence_pattern
                trigger = CronTrigger(
                    hour=pattern.get("hour", 9),
                    minute=pattern.get("minute", 0),
                    day_of_week=pattern.get("day_of_week"),
                    day=pattern.get("day"),
                    timezone=scheduled_email.timezone
                )
            else:
                # One-time email
                trigger = DateTrigger(
                    run_date=scheduled_email.scheduled_at,
                    timezone=scheduled_email.timezone
                )
            
            self.scheduler.add_job(
                func=self._execute_scheduled_email,
                trigger=trigger,
                args=[scheduled_email.id],
                id=job_id,
                replace_existing=True
            )
            
            logger.info(f"📋 Job scheduled: {job_id}")
            
        except Exception as e:
            logger.error(f"❌ Error scheduling job: {e}")
    
    async def _execute_scheduled_email(self, scheduled_email_id: int):
        """Execute scheduled email sending"""
        try:
            scheduled_email = self.db.query(ScheduledEmail).filter(
                ScheduledEmail.id == scheduled_email_id
            ).first()
            
            if not scheduled_email or scheduled_email.status != "scheduled":
                logger.warning(f"⚠️ Scheduled email {scheduled_email_id} not found or already processed")
                return
            
            logger.info(f"📧 Executing scheduled email: {scheduled_email.name}")
            
            # Update status to sending
            scheduled_email.status = "sending"
            self.db.commit()
            
            # Get template
            template = self.db.query(EmailTemplate).filter(
                EmailTemplate.id == scheduled_email.template_id
            ).first()
            
            if not template:
                scheduled_email.status = "failed"
                scheduled_email.sent_at = datetime.utcnow()
                self.db.commit()
                logger.error(f"❌ Template not found for scheduled email {scheduled_email_id}")
                return
            
            sent_count = 0
            failed_count = 0
            
            # Process each recipient
            for recipient in scheduled_email.recipients:
                try:
                    # Prepare variables for this recipient
                    recipient_variables = scheduled_email.variables.copy()
                    recipient_variables.update(self._get_recipient_variables(recipient))
                    
                    # Use subject override or template subject
                    subject = scheduled_email.subject_override or template.subject
                    
                    # Send email
                    email_data = {
                        "template_id": scheduled_email.template_id,
                        "recipient_email": recipient["email"],
                        "variables": recipient_variables,
                        "subject_override": subject
                    }
                    
                    result = self.email_service.send_single_email(email_data)
                    
                    # Log delivery
                    delivery_log = EmailDeliveryLog(
                        scheduled_email_id=scheduled_email.id,
                        recipient_email=recipient["email"],
                        recipient_name=recipient.get("name", ""),
                        status="sent" if result.get("success") else "failed",
                        sent_at=datetime.utcnow() if result.get("success") else None,
                        error_message=result.get("error") if not result.get("success") else None,
                        tracking_id=str(uuid.uuid4())
                    )
                    
                    self.db.add(delivery_log)
                    
                    if result.get("success"):
                        sent_count += 1
                        logger.info(f"✅ Email sent to {recipient['email']}")
                    else:
                        failed_count += 1
                        logger.error(f"❌ Failed to send email to {recipient['email']}: {result.get('error')}")
                    
                    # Small delay between emails
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(f"❌ Error sending to {recipient.get('email', 'unknown')}: {e}")
                    
                    # Log failed delivery
                    delivery_log = EmailDeliveryLog(
                        scheduled_email_id=scheduled_email.id,
                        recipient_email=recipient.get("email", ""),
                        recipient_name=recipient.get("name", ""),
                        status="failed",
                        error_message=str(e),
                        tracking_id=str(uuid.uuid4())
                    )
                    self.db.add(delivery_log)
            
            # Update scheduled email status
            scheduled_email.sent_count = sent_count
            scheduled_email.failed_count = failed_count
            scheduled_email.status = "sent" if failed_count == 0 else "partial"
            scheduled_email.sent_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"🎉 Scheduled email completed: {sent_count} sent, {failed_count} failed")
            
            # Schedule next occurrence if recurring
            if scheduled_email.is_recurring and scheduled_email.recurrence_pattern:
                self._schedule_next_occurrence(scheduled_email)
                
        except Exception as e:
            logger.error(f"❌ Error executing scheduled email {scheduled_email_id}: {e}")
            
            # Update status to failed
            try:
                scheduled_email = self.db.query(ScheduledEmail).filter(
                    ScheduledEmail.id == scheduled_email_id
                ).first()
                
                if scheduled_email:
                    scheduled_email.status = "failed"
                    scheduled_email.sent_at = datetime.utcnow()
                    self.db.commit()
                    
            except Exception as commit_error:
                logger.error(f"❌ Error updating failed status: {commit_error}")
    
    def _process_recipients(self, recipients_input: Any, category: str) -> List[Dict]:
        """Process recipients based on input type and category"""
        recipients = []
        
        try:
            if isinstance(recipients_input, str):
                # Single email or comma-separated emails
                emails = [email.strip() for email in recipients_input.split(",")]
                recipients = [{"email": email, "name": ""} for email in emails if self._is_valid_email(email)]
                
            elif isinstance(recipients_input, list):
                # List of emails or recipient objects
                for item in recipients_input:
                    if isinstance(item, str) and self._is_valid_email(item):
                        recipients.append({"email": item, "name": ""})
                    elif isinstance(item, dict) and self._is_valid_email(item.get("email", "")):
                        recipients.append(item)
                        
            elif isinstance(recipients_input, dict):
                # Category-based or filtered recipients
                recipients = self._get_category_recipients(recipients_input, category)
            
            # Enhance recipients with category-specific data
            enhanced_recipients = []
            for recipient in recipients:
                enhanced = self._enhance_recipient_data(recipient, category)
                if enhanced:
                    enhanced_recipients.append(enhanced)
            
            return enhanced_recipients
            
        except Exception as e:
            logger.error(f"❌ Error processing recipients: {e}")
            return []
    
    def _get_category_recipients(self, filter_criteria: Dict, category: str) -> List[Dict]:
        """Get recipients based on category and filter criteria"""
        recipients = []
        
        try:
            if category in ["interview", "test"]:
                # Get candidates based on criteria
                query = self.db.query(Candidate)
                
                if filter_criteria.get("job_id"):
                    # Candidates applied to specific job
                    query = query.join(JobApplication).filter(
                        JobApplication.job_id == filter_criteria["job_id"]
                    )
                
                if filter_criteria.get("status"):
                    query = query.filter(Candidate.status.in_(filter_criteria["status"]))
                
                if filter_criteria.get("skills"):
                    for skill in filter_criteria["skills"]:
                        query = query.filter(Candidate.skills.op('?')(skill))
                
                candidates = query.all()
                recipients = [
                    {
                        "email": c.email,
                        "name": c.full_name,
                        "candidate_id": c.id,
                        "phone": c.phone
                    }
                    for c in candidates if c.email
                ]
                
            elif category == "bulk":
                # Handle bulk recipients
                if filter_criteria.get("all_candidates"):
                    candidates = self.db.query(Candidate).filter(Candidate.email.isnot(None)).all()
                    recipients = [
                        {"email": c.email, "name": c.full_name, "candidate_id": c.id}
                        for c in candidates
                    ]
                elif filter_criteria.get("emails"):
                    recipients = [
                        {"email": email, "name": ""}
                        for email in filter_criteria["emails"]
                        if self._is_valid_email(email)
                    ]
                    
        except Exception as e:
            logger.error(f"❌ Error getting category recipients: {e}")
        
        return recipients
    
    def _enhance_recipient_data(self, recipient: Dict, category: str) -> Dict:
        """Enhance recipient data with category-specific information"""
        try:
            enhanced = recipient.copy()
            
            # Try to find candidate if not already provided
            if not enhanced.get("candidate_id") and enhanced.get("email"):
                candidate = self.db.query(Candidate).filter(
                    Candidate.email == enhanced["email"]
                ).first()
                
                if candidate:
                    enhanced.update({
                        "candidate_id": candidate.id,
                        "name": candidate.full_name,
                        "phone": candidate.phone,
                        "experience_years": candidate.experience_years,
                        "skills": candidate.skills
                    })
            
            # Add category-specific enhancements
            if category == "interview":
                enhanced["type"] = "interview_invitation"
            elif category == "test":
                enhanced["type"] = "test_invitation"
            elif category == "follow_up":
                enhanced["type"] = "follow_up"
            
            return enhanced
            
        except Exception as e:
            logger.error(f"❌ Error enhancing recipient data: {e}")
            return recipient
    
    def _get_recipient_variables(self, recipient: Dict) -> Dict:
        """Get personalized variables for recipient"""
        variables = {
            "recipient_email": recipient.get("email", ""),
            "recipient_name": recipient.get("name", "Valued Candidate"),
            "company_name": "Navikenz India Pvt Ltd",
            "current_date": datetime.now().strftime("%B %d, %Y")
        }
        
        # Add candidate-specific variables if available
        if recipient.get("candidate_id"):
            try:
                candidate = self.db.query(Candidate).filter(
                    Candidate.id == recipient["candidate_id"]
                ).first()
                
                if candidate:
                    variables.update({
                        "candidate_name": candidate.full_name,
                        "candidate_phone": candidate.phone or "",
                        "candidate_experience": f"{candidate.experience_years} years" if candidate.experience_years else "Not specified",
                        "candidate_skills": ", ".join(candidate.skills) if candidate.skills else ""
                    })
                    
            except Exception as e:
                logger.error(f"❌ Error getting candidate variables: {e}")
        
        return variables
    
    def _parse_scheduled_time(self, scheduled_time: str, timezone_str: str) -> datetime:
        """Parse scheduled time string to datetime with timezone"""
        try:
            # Handle different time formats
            if isinstance(scheduled_time, str):
                # Try parsing ISO format first
                try:
                    dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                    return dt.astimezone(pytz.UTC)
                except:
                    # Try parsing other formats
                    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"]:
                        try:
                            dt = datetime.strptime(scheduled_time, fmt)
                            tz = pytz.timezone(timezone_str)
                            return tz.localize(dt).astimezone(pytz.UTC)
                        except:
                            continue
            
            raise ValueError(f"Unable to parse scheduled time: {scheduled_time}")
            
        except Exception as e:
            logger.error(f"❌ Error parsing scheduled time: {e}")
            # Default to 1 hour from now
            return datetime.utcnow() + timedelta(hours=1)
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def get_scheduled_emails(self, category: str = None, status: str = None) -> List[Dict]:
        """Get scheduled emails with optional filters"""
        try:
            query = self.db.query(ScheduledEmail).order_by(ScheduledEmail.scheduled_at.desc())
            
            if category:
                query = query.filter(ScheduledEmail.category == category)
            
            if status:
                query = query.filter(ScheduledEmail.status == status)
            
            scheduled_emails = query.all()
            
            return [
                {
                    "id": se.id,
                    "name": se.name,
                    "category": se.category,
                    "template_name": se.template.name if se.template else "Unknown",
                    "scheduled_at": se.scheduled_at.isoformat(),
                    "status": se.status,
                    "priority": se.priority,
                    "recipient_count": se.recipient_count,
                    "sent_count": se.sent_count,
                    "failed_count": se.failed_count,
                    "is_recurring": se.is_recurring,
                    "created_at": se.created_at.isoformat() if se.created_at else None,
                    "sent_at": se.sent_at.isoformat() if se.sent_at else None
                }
                for se in scheduled_emails
            ]
            
        except Exception as e:
            logger.error(f"❌ Error getting scheduled emails: {e}")
            return []
    
    def cancel_scheduled_email(self, schedule_id: int) -> Dict:
        """Cancel a scheduled email"""
        try:
            scheduled_email = self.db.query(ScheduledEmail).filter(
                ScheduledEmail.id == schedule_id
            ).first()
            
            if not scheduled_email:
                return {"success": False, "error": "Scheduled email not found"}
            
            if scheduled_email.status not in ["scheduled", "sending"]:
                return {"success": False, "error": "Email cannot be cancelled"}
            
            # Remove from scheduler
            job_id = f"email_schedule_{schedule_id}"
            try:
                self.scheduler.remove_job(job_id)
            except:
                pass  # Job might not exist in scheduler
            
            # Update status
            scheduled_email.status = "cancelled"
            self.db.commit()
            
            return {
                "success": True,
                "message": f"Scheduled email '{scheduled_email.name}' cancelled successfully"
            }
            
        except Exception as e:
            logger.error(f"❌ Error cancelling scheduled email: {e}")
            return {"success": False, "error": str(e)}
    
    def get_delivery_logs(self, schedule_id: int) -> List[Dict]:
        """Get delivery logs for a scheduled email"""
        try:
            logs = self.db.query(EmailDeliveryLog).filter(
                EmailDeliveryLog.scheduled_email_id == schedule_id
            ).order_by(EmailDeliveryLog.created_at.desc()).all()
            
            return [
                {
                    "id": log.id,
                    "recipient_email": log.recipient_email,
                    "recipient_name": log.recipient_name,
                    "status": log.status,
                    "sent_at": log.sent_at.isoformat() if log.sent_at else None,
                    "opened_at": log.opened_at.isoformat() if log.opened_at else None,
                    "clicked_at": log.clicked_at.isoformat() if log.clicked_at else None,
                    "error_message": log.error_message,
                    "tracking_id": log.tracking_id
                }
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"❌ Error getting delivery logs: {e}")
            return []
    
    def get_schedule_statistics(self) -> Dict:
        """Get email scheduling statistics"""
        try:
            total_scheduled = self.db.query(ScheduledEmail).count()
            pending_schedules = self.db.query(ScheduledEmail).filter(
                ScheduledEmail.status == "scheduled"
            ).count()
            
            sent_today = self.db.query(ScheduledEmail).filter(
                ScheduledEmail.sent_at >= datetime.utcnow().replace(hour=0, minute=0, second=0),
                ScheduledEmail.status.in_(["sent", "partial"])
            ).count()
            
            # Fix the func usage
            total_emails_sent = self.db.query(func.sum(ScheduledEmail.sent_count)).scalar() or 0
            
            return {
                "total_scheduled": total_scheduled,
                "pending_schedules": pending_schedules,
                "sent_today": sent_today,
                "total_emails_sent": int(total_emails_sent),
                "active_categories": self._get_active_categories()
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting statistics: {e}")
            return {
                "total_scheduled": 0,
                "pending_schedules": 0,
                "sent_today": 0,
                "total_emails_sent": 0,
                "active_categories": []
            }
        
    def _get_active_categories(self) -> List[str]:
        """Get list of active email categories"""
        try:
            categories = self.db.query(ScheduledEmail.category).distinct().all()
            return [cat[0] for cat in categories if cat[0]]
        except:
            return []
