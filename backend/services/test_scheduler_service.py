from typing import List, Dict, Optional
from database.models.assessment import TestTemplate, ScheduledTest
from database.repositories.candidate_repo import CandidateRepository
from core.tools.email_automation import EmailAutomation
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import string

class TestSchedulerService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.candidate_repo = CandidateRepository(db_session)
        self.email_automation = EmailAutomation()
    
    def create_test_template(self, template_data: Dict) -> Dict:
        """Create a new test template"""
        try:
            template = TestTemplate(**template_data)
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            
            return {
                "success": True,
                "template_id": template.id,
                "message": "Test template created successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def schedule_test(self, schedule_data: Dict) -> Dict:
        """Schedule a test for candidate(s)"""
        try:
            candidate_ids = schedule_data.get("candidate_ids", [])
            template_id = schedule_data.get("template_id")
            scheduled_date = datetime.fromisoformat(schedule_data.get("scheduled_date"))
            
            scheduled_tests = []
            
            for candidate_id in candidate_ids:
                # Generate unique access code
                access_code = self._generate_access_code()
                
                # Create test link (demo implementation)
                test_link = f"https://navikenz.mettl.com/test/{template_id}/{access_code}"
                
                scheduled_test = ScheduledTest(
                    template_id=template_id,
                    candidate_id=candidate_id,
                    job_id=schedule_data.get("job_id"),
                    scheduled_date=scheduled_date,
                    deadline=scheduled_date + timedelta(days=schedule_data.get("validity_days", 7)),
                    time_limit_minutes=schedule_data.get("time_limit", 60),
                    test_link=test_link,
                    access_code=access_code,
                    status="scheduled"
                )
                
                self.db.add(scheduled_test)
                scheduled_tests.append(scheduled_test)
            
            self.db.commit()
            
            # Send test invitations
            for test in scheduled_tests:
                self._send_test_invitation(test)
            
            return {
                "success": True,
                "scheduled_count": len(scheduled_tests),
                "test_ids": [test.id for test in scheduled_tests]
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_test_templates(self) -> List[Dict]:
        """Get all active test templates"""
        templates = self.db.query(TestTemplate).filter(TestTemplate.is_active == True).all()
        return [self._template_to_dict(template) for template in templates]
    
    def get_scheduled_tests(self, candidate_id: int = None, status: str = None) -> List[Dict]:
        """Get scheduled tests with filters"""
        query = self.db.query(ScheduledTest)
        
        if candidate_id:
            query = query.filter(ScheduledTest.candidate_id == candidate_id)
        if status:
            query = query.filter(ScheduledTest.status == status)
        
        tests = query.order_by(ScheduledTest.scheduled_date.desc()).all()
        return [self._scheduled_test_to_dict(test) for test in tests]
    
    def update_test_status(self, test_id: int, status: str, score: float = None) -> Dict:
        """Update test status and score"""
        try:
            test = self.db.query(ScheduledTest).filter(ScheduledTest.id == test_id).first()
            if not test:
                return {"success": False, "error": "Test not found"}
            
            test.status = status
            if score is not None:
                test.score = score
            
            if status == "started":
                test.started_at = datetime.utcnow()
            elif status == "completed":
                test.completed_at = datetime.utcnow()
                if test.started_at:
                    test.completion_time_minutes = int((test.completed_at - test.started_at).total_seconds() / 60)
            
            self.db.commit()
            
            return {"success": True, "status": status}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_access_code(self) -> str:
        """Generate unique access code"""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
    def _send_test_invitation(self, scheduled_test: ScheduledTest):
        """Send test invitation email"""
        try:
            candidate = self.candidate_repo.get_candidate_by_id(scheduled_test.candidate_id)
            if not candidate or not candidate.email:
                return
            
            template = self.db.query(TestTemplate).filter(
                TestTemplate.id == scheduled_test.template_id
            ).first()
            
            subject = f"Assessment Invitation - {template.name if template else 'Technical Test'}"
            
            email_body = f"""
            <html>
            <body>
                <h2>Assessment Invitation</h2>
                
                <p>Dear {candidate.full_name},</p>
                
                <p>You have been invited to take an online assessment as part of our recruitment process.</p>
                
                <h3>Test Details:</h3>
                <ul>
                    <li><strong>Test Name:</strong> {template.name if template else 'Assessment'}</li>
                    <li><strong>Duration:</strong> {scheduled_test.time_limit_minutes} minutes</li>
                    <li><strong>Deadline:</strong> {scheduled_test.deadline.strftime('%B %d, %Y at %I:%M %p')}</li>
                    <li><strong>Access Code:</strong> {scheduled_test.access_code}</li>
                </ul>
                
                <p><strong>Test Link:</strong> <a href="{scheduled_test.test_link}">{scheduled_test.test_link}</a></p>
                
                <h3>Instructions:</h3>
                <p>{template.instructions if template else 'Please complete the test within the given time limit.'}</p>
                
                <p>Good luck!</p>
                
                <p>Best regards,<br>
                NaviKenz Recruitment Team</p>
            </body>
            </html>
            """
            
            self.email_automation.send_email([candidate.email], subject, email_body)
            
        except Exception as e:
            print(f"Error sending test invitation: {e}")
    
    def _template_to_dict(self, template: TestTemplate) -> Dict:
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "category": template.category,
            "duration_minutes": template.duration_minutes,
            "total_questions": template.total_questions,
            "passing_score": template.passing_score,
            "is_active": template.is_active
        }
    
    def _scheduled_test_to_dict(self, test: ScheduledTest) -> Dict:
        return {
            "id": test.id,
            "template_name": test.template.name if test.template else "Unknown",
            "candidate_name": test.candidate.full_name if test.candidate else "Unknown",
            "scheduled_date": test.scheduled_date.isoformat(),
            "deadline": test.deadline.isoformat() if test.deadline else None,
            "status": test.status,
            "score": test.score,
            "access_code": test.access_code,
            "test_link": test.test_link
        }
