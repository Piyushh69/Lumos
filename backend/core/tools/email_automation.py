import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import os
from jinja2 import Template

class EmailAutomation:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
    def send_email(self, to_emails: List[str], subject: str, body: str, 
                   attachments: List[str] = None, is_html: bool = True) -> bool:
        """Send email with optional attachments"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject
            
            # Add body
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            # Add attachments
            if attachments:
                for file_path in attachments:
                    if os.path.isfile(file_path):
                        with open(file_path, "rb") as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename= {os.path.basename(file_path)}'
                            )
                            msg.attach(part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.smtp_username, to_emails, text)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False
    
    def send_interview_invitation(self, candidate_email: str, candidate_name: str, 
                                job_title: str, interview_date: str, interview_time: str,
                                interviewer_name: str, meeting_link: str = None) -> bool:
        """Send interview invitation email"""
        template = Template("""
        <html>
        <body>
            <h2>Interview Invitation - {{ job_title }}</h2>
            
            <p>Dear {{ candidate_name }},</p>
            
            <p>We are pleased to invite you for an interview for the position of <strong>{{ job_title }}</strong>.</p>
            
            <h3>Interview Details:</h3>
            <ul>
                <li><strong>Date:</strong> {{ interview_date }}</li>
                <li><strong>Time:</strong> {{ interview_time }}</li>
                <li><strong>Interviewer:</strong> {{ interviewer_name }}</li>
                {% if meeting_link %}
                <li><strong>Meeting Link:</strong> <a href="{{ meeting_link }}">{{ meeting_link }}</a></li>
                {% endif %}
            </ul>
            
            <p>Please confirm your availability by replying to this email.</p>
            
            <p>We look forward to speaking with you!</p>
            
            <p>Best regards,<br>
            NaviHire Recruitment Team</p>
        </body>
        </html>
        """)
        
        subject = f"Interview Invitation - {job_title}"
        body = template.render(
            candidate_name=candidate_name,
            job_title=job_title,
            interview_date=interview_date,
            interview_time=interview_time,
            interviewer_name=interviewer_name,
            meeting_link=meeting_link
        )
        
        return self.send_email([candidate_email], subject, body)
    
    def send_application_confirmation(self, candidate_email: str, candidate_name: str, 
                                    job_title: str) -> bool:
        """Send application confirmation email"""
        template = Template("""
        <html>
        <body>
            <h2>Application Received - {{ job_title }}</h2>
            
            <p>Dear {{ candidate_name }},</p>
            
            <p>Thank you for your interest in the <strong>{{ job_title }}</strong> position at our company.</p>
            
            <p>We have successfully received your application and our recruitment team will review it shortly.</p>
            
            <p>You will hear from us within the next 5-7 business days regarding the next steps.</p>
            
            <p>Best regards,<br>
            NaviHire Recruitment Team</p>
        </body>
        </html>
        """)
        
        subject = f"Application Received - {job_title}"
        body = template.render(
            candidate_name=candidate_name,
            job_title=job_title
        )
        
        return self.send_email([candidate_email], subject, body)
    
    def send_travel_approval_request(self, approver_email: str, requester_name: str,
                                   travel_details: dict) -> bool:
        """Send travel approval request email"""
        template = Template("""
        <html>
        <body>
            <h2>Travel Approval Request</h2>
            
            <p>Dear Approver,</p>
            
            <p><strong>{{ requester_name }}</strong> has requested approval for business travel:</p>
            
            <h3>Travel Details:</h3>
            <ul>
                <li><strong>Purpose:</strong> {{ travel_details.purpose }}</li>
                <li><strong>Route:</strong> {{ travel_details.origin }} → {{ travel_details.destination }}</li>
                <li><strong>Departure:</strong> {{ travel_details.departure_date }}</li>
                <li><strong>Return:</strong> {{ travel_details.return_date }}</li>
                <li><strong>Estimated Cost:</strong> {{ travel_details.estimated_cost }}</li>
            </ul>
            
            <p>Please review and approve this request in the NaviHire system.</p>
            
            <p>Best regards,<br>
            NaviHire Travel Management</p>
        </body>
        </html>
        """)
        
        subject = f"Travel Approval Required - {travel_details.get('purpose', 'Business Travel')}"
        body = template.render(
            requester_name=requester_name,
            travel_details=travel_details
        )
        
        return self.send_email([approver_email], subject, body)