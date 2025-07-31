from typing import List, Dict, Optional, Any
from database.models.email_templates import EmailTemplate, EmailSignature, EmailAddon, EmailCampaign
from database.repositories.candidate_repo import CandidateRepository
from core.tools.email_automation import EmailAutomation
from sqlalchemy.orm import Session
from jinja2 import Template
from datetime import datetime
import re

class EmailAutomationService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.candidate_repo = CandidateRepository(db_session)
        self.email_automation = EmailAutomation()
    
    def create_email_template(self, template_data: Dict) -> Dict:
        """Create a new email template"""
        try:
            # Extract variables from template body
            variables = self._extract_template_variables(template_data.get("body_html", ""))
            template_data["variables"] = variables
            
            template = EmailTemplate(**template_data)
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            
            return {
                "success": True,
                "template_id": template.id,
                "variables": variables,
                "message": "Email template created successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_email_templates(self, category: str = None) -> List[Dict]:
        """Get email templates with optional category filter"""
        query = self.db.query(EmailTemplate).filter(EmailTemplate.is_active == True)
        
        if category:
            query = query.filter(EmailTemplate.category == category)
        
        templates = query.order_by(EmailTemplate.name).all()
        return [self._template_to_dict(template) for template in templates]
    
    # def send_single_email(self, email_data: Dict) -> Dict:
    #     """Send email to a single recipient"""
    #     try:
    #         template_id = email_data.get("template_id")
    #         recipient_email = email_data.get("recipient_email")
    #         variables = email_data.get("variables", {})
            
    #         if not template_id or not recipient_email:
    #             return {"success": False, "error": "Template ID and recipient email are required"}
            
    #         # Get template
    #         template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    #         if not template:
    #             return {"success": False, "error": "Template not found"}
            
    #         # Render email content
    #         rendered_content = self._render_email_template(template, variables)
            
    #         # Add signature and addons
    #         final_content = self._add_signature_and_addons(rendered_content["body_html"])
            
    #         # Send email
    #         success = self.email_automation.send_email(
    #             [recipient_email],
    #             rendered_content["subject"],
    #             final_content,
    #             is_html=True
    #         )
            
    #         if success:
    #             # Update template usage
    #             template.usage_count += 1
    #             template.last_used = datetime.utcnow()
    #             self.db.commit()
            
    #         return {
    #             "success": success,
    #             "message": "Email sent successfully" if success else "Failed to send email"
    #         }
            
    #     except Exception as e:
    #         return {"success": False, "error": str(e)}
    
    def send_single_email(self, email_data: Dict) -> Dict:
        """Send email to a single recipient with enhanced logging"""
        try:
            template_id = email_data.get("template_id")
            recipient_email = email_data.get("recipient_email")
            variables = email_data.get("variables", {})
            
            if not template_id or not recipient_email:
                return {"success": False, "error": "Template ID and recipient email are required"}
            
            # Get template
            template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
            if not template:
                return {"success": False, "error": "Template not found"}
            
            # Render email content
            rendered_content = self._render_email_template(template, variables)
            
            # Add signature and addons
            final_content = self._add_signature_and_addons(rendered_content["body_html"])
            
            # Enhanced logging
            print(f"Sending email to: {recipient_email}")
            print(f"Subject: {rendered_content['subject']}")
            print(f"Template: {template.name}")
            
            # Send email with enhanced service
            success = self.email_automation.send_email(
                [recipient_email],
                rendered_content["subject"],
                final_content,
                is_html=True
            )
            
            if success:
                # Update template usage
                template.usage_count += 1
                template.last_used = datetime.utcnow()
                self.db.commit()
                print(f"Email sent successfully to {recipient_email}")
            else:
                print(f"Email sending failed to {recipient_email}")
            
            return {
                "success": success,
                "message": "Email sent successfully" if success else "Failed to send email",
                "recipient": recipient_email,
                "template_used": template.name
            }
            
        except Exception as e:
            print(f"Email service error: {str(e)}")
            return {"success": False, "error": str(e)}

    def send_bulk_email(self, campaign_data: Dict) -> Dict:
        """Send bulk email campaign"""
        try:
            template_id = campaign_data.get("template_id")
            recipient_type = campaign_data.get("recipient_type", "bulk")
            recipient_data = campaign_data.get("recipient_data", [])
            
            # Create campaign record
            campaign = EmailCampaign(
                name=campaign_data.get("name", f"Campaign {datetime.now().strftime('%Y%m%d_%H%M')}"),
                template_id=template_id,
                sender_name=campaign_data.get("sender_name", "NaviKenz HR"),
                sender_email=campaign_data.get("sender_email", "hr@navikenz.com"),
                recipient_type=recipient_type,
                recipient_data=recipient_data,
                send_immediately=campaign_data.get("send_immediately", True),
                scheduled_at=campaign_data.get("scheduled_at"),
                created_by=campaign_data.get("created_by"),
                status="sending"
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
            
            # Process recipients
            recipients = self._process_recipients(recipient_type, recipient_data)
            campaign.total_recipients = len(recipients)
            
            sent_count = 0
            failed_count = 0
            
            for recipient in recipients:
                try:
                    # Personalize variables for each recipient
                    variables = self._get_recipient_variables(recipient)
                    variables.update(campaign_data.get("global_variables", {}))
                    
                    # Render email content
                    rendered_content = self._render_email_template(template, variables)
                    
                    # Add signature and addons
                    final_content = self._add_signature_and_addons(rendered_content["body_html"])
                    
                    # Send email
                    success = self.email_automation.send_email(
                        [recipient["email"]],
                        rendered_content["subject"],
                        final_content,
                        is_html=True
                    )
                    
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    print(f"Failed to send email to {recipient.get('email', 'unknown')}: {e}")
                    failed_count += 1
            
            # Update campaign status
            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.status = "sent" if failed_count == 0 else "partial"
            campaign.sent_at = datetime.utcnow()
            
            # Update template usage
            template.usage_count += sent_count
            template.last_used = datetime.utcnow()
            
            self.db.commit()
            
            return {
                "success": True,
                "campaign_id": campaign.id,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_recipients": len(recipients)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_email_signature(self, signature_data: Dict) -> Dict:
        """Create email signature"""
        try:
            # If this is set as default, unset other defaults
            if signature_data.get("is_default"):
                self.db.query(EmailSignature).update({"is_default": False})
            
            signature = EmailSignature(**signature_data)
            self.db.add(signature)
            self.db.commit()
            self.db.refresh(signature)
            
            return {
                "success": True,
                "signature_id": signature.id,
                "message": "Email signature created successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_email_addon(self, addon_data: Dict) -> Dict:
        """Create email addon"""
        try:
            addon = EmailAddon(**addon_data)
            self.db.add(addon)
            self.db.commit()
            self.db.refresh(addon)
            
            return {
                "success": True,
                "addon_id": addon.id,
                "message": "Email addon created successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_email_signatures(self) -> List[Dict]:
        """Get all active email signatures"""
        signatures = self.db.query(EmailSignature).filter(EmailSignature.is_active == True).all()
        return [self._signature_to_dict(signature) for signature in signatures]
    
    def get_email_addons(self) -> List[Dict]:
        """Get all active email addons"""
        addons = self.db.query(EmailAddon).filter(EmailAddon.is_active == True).all()
        return [self._addon_to_dict(addon) for addon in addons]
    
    def get_campaign_history(self, limit: int = 50) -> List[Dict]:
        """Get email campaign history"""
        campaigns = self.db.query(EmailCampaign).order_by(
            EmailCampaign.created_at.desc()
        ).limit(limit).all()
        
        return [self._campaign_to_dict(campaign) for campaign in campaigns]
    
    def _extract_template_variables(self, template_content: str) -> List[str]:
        """Extract template variables from content"""
        # Find all {{variable}} patterns
        pattern = r'\{\{\s*(\w+)\s*\}\}'
        variables = re.findall(pattern, template_content)
        return list(set(variables))  # Remove duplicates
    
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
            print(f"Template rendering error: {e}")
            return {
                "subject": template.subject,
                "body_html": template.body_html
            }
    
    def _add_signature_and_addons(self, email_content: str) -> str:
        """Add signature and addons to email content"""
        try:
            # Get default signature
            signature = self.db.query(EmailSignature).filter(
                EmailSignature.is_default == True,
                EmailSignature.is_active == True
            ).first()
            
            # Get auto-include addons
            addons = self.db.query(EmailAddon).filter(
                EmailAddon.auto_include == True,
                EmailAddon.is_active == True
            ).all()
            
            final_content = email_content
            
            # Add addons
            for addon in addons:
                final_content += f"\n\n{addon.content}"
            
            # Add signature
            if signature:
                final_content += f"\n\n{signature.html_content}"
            
            return final_content
            
        except Exception as e:
            print(f"Error adding signature/addons: {e}")
            return email_content
    
    def _process_recipients(self, recipient_type: str, recipient_data: Any) -> List[Dict]:
        """Process recipients based on type"""
        recipients = []
        
        if recipient_type == "individual":
            recipients = [{"email": recipient_data, "name": ""}]
        elif recipient_type == "bulk":
            for item in recipient_data:
                if isinstance(item, str):
                    recipients.append({"email": item, "name": ""})
                elif isinstance(item, dict):
                    recipients.append(item)
        elif recipient_type == "filtered":
            # Get candidates based on filter criteria
            candidates = self._get_filtered_candidates(recipient_data)
            recipients = [{"email": c.email, "name": c.full_name, "candidate_id": c.id} for c in candidates if c.email]
        
        return recipients
    
    def _get_filtered_candidates(self, filter_criteria: Dict) -> List:
        """Get candidates based on filter criteria"""
        query = self.db.query(self.candidate_repo.db.query(Candidate))
        
        if filter_criteria.get("status"):
            query = query.filter(Candidate.status == filter_criteria["status"])
        
        if filter_criteria.get("skills"):
            for skill in filter_criteria["skills"]:
                query = query.filter(Candidate.skills.op('?')(skill))
        
        if filter_criteria.get("min_experience"):
            query = query.filter(Candidate.experience_years >= filter_criteria["min_experience"])
        
        return query.all()
    
    def _get_recipient_variables(self, recipient: Dict) -> Dict:
        """Get personalized variables for recipient"""
        variables = {
            "recipient_email": recipient.get("email", ""),
            "recipient_name": recipient.get("name", ""),
            "company_name": "NaviKenz",
            "current_date": datetime.now().strftime("%B %d, %Y")
        }
        
        # If recipient is a candidate, add candidate-specific variables
        if recipient.get("candidate_id"):
            candidate = self.candidate_repo.get_candidate_by_id(recipient["candidate_id"])
            if candidate:
                variables.update({
                    "candidate_name": candidate.full_name,
                    "candidate_email": candidate.email,
                    "candidate_phone": candidate.phone or "",
                    "candidate_location": candidate.location or "",
                    "candidate_experience": f"{candidate.experience_years} years" if candidate.experience_years else "Not specified"
                })
        
        return variables
    
    def _template_to_dict(self, template: EmailTemplate) -> Dict:
        return {
            "id": template.id,
            "name": template.name,
            "category": template.category,
            "subject": template.subject,
            "body_html": template.body_html,
            "variables": template.variables,
            "usage_count": template.usage_count,
            "last_used": template.last_used.isoformat() if template.last_used else None,
            "is_system_template": template.is_system_template
        }
    
    def _signature_to_dict(self, signature: EmailSignature) -> Dict:
        return {
            "id": signature.id,
            "name": signature.name,
            "html_content": signature.html_content,
            "company_logo_url": signature.company_logo_url,
            "company_name": signature.company_name,
            "is_default": signature.is_default
        }
    
    def _addon_to_dict(self, addon: EmailAddon) -> Dict:
        return {
            "id": addon.id,
            "name": addon.name,
            "type": addon.type,
            "content": addon.content,
            "auto_include": addon.auto_include
        }
    
    def _campaign_to_dict(self, campaign: EmailCampaign) -> Dict:
        return {
            "id": campaign.id,
            "name": campaign.name,
            "template_name": campaign.template.name if campaign.template else "Unknown",
            "status": campaign.status,
            "total_recipients": campaign.total_recipients,
            "sent_count": campaign.sent_count,
            "failed_count": campaign.failed_count,
            "created_at": campaign.created_at.isoformat(),
            "sent_at": campaign.sent_at.isoformat() if campaign.sent_at else None
        }