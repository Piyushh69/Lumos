from typing import List, Dict, Optional, Any
from database.models.email_templates import EmailTemplate, EmailSignature, EmailAddon, EmailCampaign
from database.models.candidate import Candidate
from database.models.user import User
from sqlalchemy.orm import Session
from jinja2 import Template
from datetime import datetime
import re
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# from email.mime.base import MimeBase
# from email import encoders
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModernEmailService:
    """Modern email service with multiple provider support"""
    
    def __init__(self):
        self.smtp_config = {
            'host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
            'port': int(os.getenv('SMTP_PORT', '587')),
            'username': os.getenv('SMTP_USERNAME'),
            'password': os.getenv('SMTP_PASSWORD'),
            'use_tls': os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        }
        
        # Alternative: Use SendGrid, AWS SES, or other services
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        self.aws_ses_region = os.getenv('AWS_SES_REGION', 'us-east-1')
        
    def send_email(self, recipients: List[str], subject: str, html_content: str, 
                   text_content: str = None, sender_email: str = None, sender_name: str = None) -> bool:
        """Send email using the configured method"""
        try:
            if self.sendgrid_api_key:
                return self._send_with_sendgrid(recipients, subject, html_content, text_content, sender_email, sender_name)
            elif self.smtp_config['username'] and self.smtp_config['password']:
                return self._send_with_smtp(recipients, subject, html_content, text_content, sender_email, sender_name)
            else:
                logger.error("No email service configured")
                return False
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return False
    
    # def _send_with_smtp(self, recipients: List[str], subject: str, html_content: str, 
    #                    text_content: str = None, sender_email: str = None, sender_name: str = None) -> bool:
    #     """Send email using SMTP"""
    #     try:
    #         # Create message
    #         msg = MIMEMultipart('alternative')
    #         msg['Subject'] = subject
    #         msg['From'] = f"{sender_name or 'Navikenz HR'} <{sender_email or self.smtp_config['username']}>"
    #         msg['To'] = ', '.join(recipients)
            
    #         # Add text and HTML parts
    #         if text_content:
    #             text_part = MIMEText(text_content, 'plain')
    #             msg.attach(text_part)
            
    #         html_part = MIMEText(html_content, 'html')
    #         msg.attach(html_part)
            
    #         # Create SMTP connection
    #         context = ssl.create_default_context()
            
    #         with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
    #             if self.smtp_config['use_tls']:
    #                 server.starttls(context=context)
                
    #             server.login(self.smtp_config['username'], self.smtp_config['password'])
                
    #             for recipient in recipients:
    #                 msg['To'] = recipient
    #                 server.send_message(msg)
    #                 logger.info(f"Email sent successfully to {recipient}")
            
    #         return True
            
    #     except Exception as e:
    #         logger.error(f"SMTP email sending failed: {str(e)}")
    #         return False
    
    def _send_with_smtp(self, recipients: List[str], subject: str, html_content: str, 
                   text_content: str = None, sender_email: str = None, sender_name: str = None) -> bool:
        """Send email using SMTP - Fixed RFC 5322 compliance"""
        try:
            # Create SMTP connection
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                if self.smtp_config['use_tls']:
                    server.starttls(context=context)
                
                server.login(self.smtp_config['username'], self.smtp_config['password'])
                
                # Send to each recipient individually to avoid multiple To headers
                for recipient in recipients:
                    # Create a new message for each recipient
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = subject
                    msg['From'] = f"{sender_name or 'Navikenz HR'} <{sender_email or self.smtp_config['username']}>"
                    msg['To'] = recipient  # Set To header only once per message
                    
                    if text_content:
                        text_part = MIMEText(text_content, 'plain', 'utf-8')
                        msg.attach(text_part)
                    
                    html_part = MIMEText(html_content, 'html', 'utf-8')
                    msg.attach(html_part)
                    
                    # Send the message
                    server.send_message(msg, from_addr=sender_email or self.smtp_config['username'], to_addrs=[recipient])
                    logger.info(f"Email sent successfully to {recipient}")
            
            return True
            
        except Exception as e:
            logger.error(f"SMTP email sending failed: {str(e)}")
            return False

    def _send_with_sendgrid(self, recipients: List[str], subject: str, html_content: str, 
                           text_content: str = None, sender_email: str = None, sender_name: str = None) -> bool:
        """Send email using SendGrid API"""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            
            from_email = Email(sender_email or "hr@navikenz.com", sender_name or "Navikenz HR")
            
            for recipient in recipients:
                to_email = To(recipient)
                
                mail = Mail(
                    from_email=from_email,
                    to_emails=[to_email],
                    subject=subject,
                    html_content=Content("text/html", html_content)
                )
                
                if text_content:
                    mail.content = [
                        Content("text/plain", text_content),
                        Content("text/html", html_content)
                    ]
                
                response = sg.send(mail)
                logger.info(f"SendGrid email sent to {recipient}, status: {response.status_code}")
            
            return True
            
        except Exception as e:
            logger.error(f"SendGrid email sending failed: {str(e)}")
            return False


class EmailAutomationService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.email_service = ModernEmailService()
    
    def create_email_template(self, template_data: Dict) -> Dict:
        """Create a new email template with enhanced validation"""
        try:
            # Extract variables from template body and subject
            body_html = template_data.get("body_html", "")
            subject = template_data.get("subject", "")
            
            variables = self._extract_template_variables(f"{body_html} {subject}")
            template_data["variables"] = variables
            
            # Set defaults
            template_data.setdefault("is_active", True)
            template_data.setdefault("is_system_template", False)
            template_data.setdefault("usage_count", 0)
            template_data.setdefault("category", "general")
            
            template = EmailTemplate(**template_data)
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            
            logger.info(f"Email template created: {template.name} (ID: {template.id})")
            
            return {
                "success": True,
                "template": {
                    "id": template.id,
                    "name": template.name,
                    "variables": variables,
                    "category": template.category
                },
                "message": "Email template created successfully"
            }
        except Exception as e:
            logger.error(f"Template creation failed: {str(e)}")
            self.db.rollback()
            return {"success": False, "error": str(e)}
    
    def get_email_templates(self, category: str = None) -> List[Dict]:
        """Get email templates with optional category filter"""
        try:
            query = self.db.query(EmailTemplate).filter(EmailTemplate.is_active == True)
            
            if category:
                query = query.filter(EmailTemplate.category == category)
            
            templates = query.order_by(EmailTemplate.name).all()
            return [self._template_to_dict(template) for template in templates]
        except Exception as e:
            logger.error(f"Failed to get templates: {str(e)}")
            return []
    
    def send_single_email(self, email_data: Dict) -> Dict:
        """Send email to a single recipient with enhanced error handling"""
        try:
            template_id = email_data.get("template_id")
            recipient_email = email_data.get("recipient_email")
            variables = email_data.get("variables", {})
            signature_id = email_data.get("signature_id")
            priority = email_data.get("priority", "normal")
            
            if not template_id or not recipient_email:
                return {"success": False, "error": "Template ID and recipient email are required"}
            
            # Validate email format
            if not self._is_valid_email(recipient_email):
                return {"success": False, "error": "Invalid email format"}
            
            # Get template
            template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
            if not template:
                return {"success": False, "error": "Template not found"}
            
            # Render email content
            rendered_content = self._render_email_template(template, variables)
            
            # Add signature and addons
            final_content = self._add_signature_and_addons(
                rendered_content["body_html"], 
                signature_id
            )
            
            # Generate text version from HTML
            text_content = self._html_to_text(final_content)
            
            # Enhanced logging
            logger.info(f"Sending email to: {recipient_email}")
            logger.info(f"Subject: {rendered_content['subject']}")
            logger.info(f"Template: {template.name}")
            logger.info(f"Priority: {priority}")
            
            # Send email with modern service
            success = self.email_service.send_email(
                recipients=[recipient_email],
                subject=rendered_content["subject"],
                html_content=final_content,
                text_content=text_content,
                sender_email=email_data.get("sender_email"),
                sender_name=email_data.get("sender_name", "Navikenz HR")
            )
            
            if success:
                # Update template usage
                template.usage_count += 1
                template.last_used = datetime.utcnow()
                self.db.commit()
                logger.info(f"Email sent successfully to {recipient_email}")
            else:
                logger.error(f"Email sending failed to {recipient_email}")
            
            return {
                "success": success,
                "message": "Email sent successfully" if success else "Failed to send email",
                "recipient": recipient_email,
                "template_used": template.name,
                "priority": priority
            }
            
        except Exception as e:
            logger.error(f"Email service error: {str(e)}")
            return {"success": False, "error": str(e)}

    def send_bulk_email(self, campaign_data: Dict) -> Dict:
        """Send bulk email campaign with enhanced tracking"""
        try:
            template_id = campaign_data.get("template_id")
            campaign_name = campaign_data.get("campaign_name", f"Campaign {datetime.now().strftime('%Y%m%d_%H%M')}")
            
            # Process different recipient types
            recipient_emails = []
            candidate_ids = campaign_data.get("candidate_ids", [])
            recipient_emails_raw = campaign_data.get("recipient_emails", [])
            
            # Add manual email recipients
            if recipient_emails_raw:
                recipient_emails.extend([email.strip() for email in recipient_emails_raw if self._is_valid_email(email.strip())])
            
            # Add candidate emails
            if candidate_ids:
                candidates = self.db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
                for candidate in candidates:
                    if candidate.email and self._is_valid_email(candidate.email):
                        recipient_emails.append(candidate.email)
            
            # Handle filtered candidates (e.g., all shortlisted)
            if campaign_data.get("recipient_type") == "candidates":
                filter_criteria = campaign_data.get("filter_criteria", {})
                candidates = self._get_filtered_candidates(filter_criteria)
                for candidate in candidates:
                    if candidate.email and self._is_valid_email(candidate.email):
                        recipient_emails.append(candidate.email)
            
            # Remove duplicates
            recipient_emails = list(set(recipient_emails))
            
            if not recipient_emails:
                return {"success": False, "error": "No valid recipients found"}
            
            # Create campaign record
            campaign = EmailCampaign(
                name=campaign_name,
                template_id=template_id,
                sender_name=campaign_data.get("sender_name", "Navikenz HR"),
                sender_email=campaign_data.get("sender_email", "hr@navikenz.com"),
                recipient_type="bulk",
                recipient_data={"emails": recipient_emails},
                send_immediately=campaign_data.get("send_immediately", True),
                scheduled_at=campaign_data.get("scheduled_at"),
                status="sending",
                total_recipients=len(recipient_emails)
            )
            
            self.db.add(campaign)
            self.db.commit()
            self.db.refresh(campaign)
            
            # Get template
            template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
            if not template:
                campaign.status = "failed"
                self.db.commit()
                return {"success": False, "error": "Template not found"}
            
            sent_count = 0
            failed_count = 0
            variables = campaign_data.get("variables", {})
            
            # Add global variables
            variables.update({
                "company_name": "Navikenz India Pvt Ltd",
                "current_date": datetime.now().strftime("%B %d, %Y"),
                "campaign_name": campaign_name
            })
            
            logger.info(f"Starting bulk email campaign: {campaign_name} to {len(recipient_emails)} recipients")
            
            for email in recipient_emails:
                try:
                    # Personalize variables for each recipient
                    recipient_variables = variables.copy()
                    recipient_variables.update(self._get_recipient_variables(email))
                    
                    # Render email content
                    rendered_content = self._render_email_template(template, recipient_variables)
                    
                    # Add signature and addons
                    final_content = self._add_signature_and_addons(
                        rendered_content["body_html"],
                        campaign_data.get("signature_id")
                    )
                    
                    # Generate text version
                    text_content = self._html_to_text(final_content)
                    
                    # Send email
                    success = self.email_service.send_email(
                        recipients=[email],
                        subject=rendered_content["subject"],
                        html_content=final_content,
                        text_content=text_content,
                        sender_email=campaign.sender_email,
                        sender_name=campaign.sender_name
                    )
                    
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"Failed to send email to {email}: {e}")
                    failed_count += 1
            
            # Update campaign status
            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.status = "completed" if failed_count == 0 else "partial"
            campaign.sent_at = datetime.utcnow()
            
            # Update template usage
            template.usage_count += sent_count
            template.last_used = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Campaign completed: {sent_count} sent, {failed_count} failed")
            
            return {
                "success": True,
                "campaign_id": campaign.id,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_recipients": len(recipient_emails),
                "campaign_name": campaign_name
            }
            
        except Exception as e:
            logger.error(f"Bulk email campaign failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def create_email_signature(self, signature_data: Dict) -> Dict:
        """Create email signature with validation"""
        try:
            # If this is set as default, unset other defaults
            if signature_data.get("is_default", False):
                self.db.query(EmailSignature).update({"is_default": False})
                self.db.commit()
            
            # Set defaults
            signature_data.setdefault("is_active", True)
            signature_data.setdefault("company_name", "Navikenz India Pvt Ltd")
            
            signature = EmailSignature(**signature_data)
            self.db.add(signature)
            self.db.commit()
            self.db.refresh(signature)
            
            logger.info(f"Email signature created: {signature.name} (ID: {signature.id})")
            
            return {
                "success": True,
                "signature": {
                    "id": signature.id,
                    "name": signature.name,
                    "is_default": signature.is_default
                },
                "message": "Email signature created successfully"
            }
        except Exception as e:
            logger.error(f"Signature creation failed: {str(e)}")
            self.db.rollback()
            return {"success": False, "error": str(e)}
    
    def get_email_signatures(self) -> List[Dict]:
        """Get all active email signatures"""
        try:
            signatures = self.db.query(EmailSignature).filter(EmailSignature.is_active == True).all()
            return [self._signature_to_dict(signature) for signature in signatures]
        except Exception as e:
            logger.error(f"Failed to get signatures: {str(e)}")
            return []
    
    def get_email_campaigns(self) -> List[Dict]:
        """Get email campaign history with template info"""
        try:
            campaigns = self.db.query(EmailCampaign)\
                .outerjoin(EmailTemplate)\
                .order_by(EmailCampaign.created_at.desc())\
                .limit(50).all()
            
            return [self._campaign_to_dict(campaign) for campaign in campaigns]
        except Exception as e:
            logger.error(f"Failed to get campaigns: {str(e)}")
            return []
    
    def get_email_stats(self) -> Dict:
        """Get email automation statistics"""
        try:
            total_campaigns = self.db.query(EmailCampaign).count()
            total_emails_sent = self.db.query(EmailCampaign).with_entities(
                self.db.func.sum(EmailCampaign.sent_count)
            ).scalar() or 0
            
            failed_emails = self.db.query(EmailCampaign).with_entities(
                self.db.func.sum(EmailCampaign.failed_count)
            ).scalar() or 0
            
            success_rate = ((total_emails_sent / (total_emails_sent + failed_emails)) * 100) if (total_emails_sent + failed_emails) > 0 else 0
            
            # Get campaigns from this month
            from sqlalchemy import extract
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            campaigns_this_month = self.db.query(EmailCampaign).filter(
                extract('month', EmailCampaign.created_at) == current_month,
                extract('year', EmailCampaign.created_at) == current_year
            ).count()
            
            # Get emails from this week
            from datetime import timedelta
            week_ago = datetime.now() - timedelta(days=7)
            emails_this_week = self.db.query(EmailCampaign).filter(
                EmailCampaign.created_at >= week_ago
            ).with_entities(self.db.func.sum(EmailCampaign.sent_count)).scalar() or 0
            
            # Calculate average open rate (mock for now)
            avg_open_rate = 65.0  # This would come from email tracking
            
            return {
                "total_campaigns": total_campaigns,
                "total_emails_sent": int(total_emails_sent),
                "success_rate": round(success_rate, 1),
                "avg_open_rate": avg_open_rate,
                "campaigns_this_month": campaigns_this_month,
                "emails_this_week": int(emails_this_week)
            }
        except Exception as e:
            logger.error(f"Failed to get email stats: {str(e)}")
            return {
                "total_campaigns": 0,
                "total_emails_sent": 0,
                "success_rate": 0,
                "avg_open_rate": 0,
                "campaigns_this_month": 0,
                "emails_this_week": 0
            }
    
    def _extract_template_variables(self, template_content: str) -> List[str]:
        """Extract template variables from content"""
        pattern = r'\{\{\s*(\w+)\s*\}\}'
        variables = re.findall(pattern, template_content)
        return list(set(variables))
    
    def _render_email_template(self, template: EmailTemplate, variables: Dict) -> Dict:
        """Render email template with variables"""
        try:
            subject_template = Template(template.subject)
            body_template = Template(template.body_html)
            
            rendered_subject = subject_template.render(**variables)
            rendered_body = body_template.render(**variables)
            
            return {
                "subject": rendered_subject,
                "body_html": rendered_body
            }
        except Exception as e:
            logger.error(f"Template rendering error: {e}")
            return {
                "subject": template.subject,
                "body_html": template.body_html
            }
    
    def _add_signature_and_addons(self, email_content: str, signature_id: int = None) -> str:
        """Add signature and addons to email content"""
        try:
            final_content = email_content
            
            # Get auto-include addons
            addons = self.db.query(EmailAddon).filter(
                EmailAddon.auto_include == True,
                EmailAddon.is_active == True
            ).all()
            
            # Add addons
            for addon in addons:
                final_content += f"\n\n<div class='email-addon'>{addon.content}</div>"
            
            # Get signature (specific or default)
            signature = None
            if signature_id:
                signature = self.db.query(EmailSignature).filter(
                    EmailSignature.id == signature_id,
                    EmailSignature.is_active == True
                ).first()
            else:
                signature = self.db.query(EmailSignature).filter(
                    EmailSignature.is_default == True,
                    EmailSignature.is_active == True
                ).first()
            
            # Add signature
            if signature:
                final_content += f"\n\n<div class='email-signature'>{signature.html_content}</div>"
            
            return final_content
            
        except Exception as e:
            logger.error(f"Error adding signature/addons: {e}")
            return email_content
    
    def _get_filtered_candidates(self, filter_criteria: Dict) -> List[Candidate]:
        """Get candidates based on filter criteria"""
        try:
            query = self.db.query(Candidate)
            
            if filter_criteria.get("status"):
                query = query.filter(Candidate.status == filter_criteria["status"])
            
            if filter_criteria.get("is_available") is not None:
                query = query.filter(Candidate.is_available == filter_criteria["is_available"])
            
            if filter_criteria.get("min_experience"):
                query = query.filter(Candidate.experience_years >= filter_criteria["min_experience"])
            
            return query.all()
        except Exception as e:
            logger.error(f"Error filtering candidates: {e}")
            return []
    
    def _get_recipient_variables(self, email: str) -> Dict:
        """Get personalized variables for recipient"""
        variables = {
            "recipient_email": email,
            "company_name": "Navikenz India Pvt Ltd",
            "current_date": datetime.now().strftime("%B %d, %Y")
        }
        
        # Try to find candidate by email
        try:
            candidate = self.db.query(Candidate).filter(Candidate.email == email).first()
            if candidate:
                variables.update({
                    "candidate_name": candidate.full_name or "Valued Candidate",
                    "candidate_email": candidate.email,
                    "candidate_phone": candidate.phone or "",
                    "candidate_location": candidate.location or "",
                    "candidate_experience": f"{candidate.experience_years} years" if candidate.experience_years else "Not specified"
                })
            else:
                variables["candidate_name"] = "Valued Candidate"
        except Exception as e:
            logger.error(f"Error getting candidate variables: {e}")
            variables["candidate_name"] = "Valued Candidate"
        
        return variables
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text"""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            return soup.get_text()
        except ImportError:
            # Fallback if BeautifulSoup not available
            import re
            text = re.sub('<[^<]+?>', '', html)
            return text.strip()
    
    def _template_to_dict(self, template: EmailTemplate) -> Dict:
        return {
            "id": template.id,
            "name": template.name,
            "category": template.category,
            "subject": template.subject,
            "body_html": template.body_html,
            "variables": template.variables or [],
            "usage_count": template.usage_count,
            "last_used": template.last_used.isoformat() if template.last_used else None,
            "is_system_template": template.is_system_template,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None
        }
    
    def _signature_to_dict(self, signature: EmailSignature) -> Dict:
        return {
            "id": signature.id,
            "name": signature.name,
            "html_content": signature.html_content,
            "company_logo_url": signature.company_logo_url,
            "company_name": signature.company_name,
            "is_default": signature.is_default,
            "created_at": signature.created_at.isoformat() if signature.created_at else None
        }
    
    def _campaign_to_dict(self, campaign: EmailCampaign) -> Dict:
        template_name = "Unknown"
        if campaign.template_id:
            template = self.db.query(EmailTemplate).filter(EmailTemplate.id == campaign.template_id).first()
            if template:
                template_name = template.name
        
        return {
            "id": campaign.id,
            "name": campaign.name,
            "template_id": campaign.template_id,
            "template_name": template_name,
            "status": campaign.status,
            "recipient_count": campaign.total_recipients,
            "sent_count": campaign.sent_count,
            "failed_count": campaign.failed_count,
            "open_rate": campaign.open_rate,
            "click_rate": campaign.click_rate,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "sent_at": campaign.sent_at.isoformat() if campaign.sent_at else None,
            "completed_at": campaign.sent_at.isoformat() if campaign.sent_at else None
        }
