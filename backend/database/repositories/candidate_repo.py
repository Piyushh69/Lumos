from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from database.models.candidate import Candidate, JobApplication
from typing import List, Optional, Dict
from datetime import datetime, timedelta

class CandidateRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_candidate(self, candidate_data: Dict) -> Candidate:
        """Create a new candidate"""
        candidate = Candidate(**candidate_data)
        self.db.add(candidate)
        self.db.commit()
        self.db.refresh(candidate)
        return candidate
    
    def get_candidate_by_id(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate by ID"""
        return self.db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    def get_candidate_by_email(self, email: str) -> Optional[Candidate]:
        """Get candidate by email"""
        return self.db.query(Candidate).filter(Candidate.email == email).first()
    
    def get_all_candidates(self, skip: int = 0, limit: int = 100) -> List[Candidate]:
        """Get all candidates with pagination"""
        return self.db.query(Candidate).offset(skip).limit(limit).all()
    
    def search_candidates(self, query: str, skills: List[str] = None, 
                         min_experience: float = None, location: str = None) -> List[Candidate]:
        """Search candidates with filters"""
        db_query = self.db.query(Candidate)
        
        if query:
            db_query = db_query.filter(
                or_(
                    Candidate.full_name.ilike(f"%{query}%"),
                    Candidate.resume_text.ilike(f"%{query}%")
                )
            )
        
        if skills:
            for skill in skills:
                db_query = db_query.filter(Candidate.skills.op('?')(skill))
        
        if min_experience:
            db_query = db_query.filter(Candidate.experience_years >= min_experience)
        
        if location:
            db_query = db_query.filter(Candidate.location.ilike(f"%{location}%"))
        
        return db_query.all()
    
    def get_top_candidates(self, limit: int = 10) -> List[Candidate]:
        """Get top candidates by overall score"""
        return self.db.query(Candidate).order_by(desc(Candidate.overall_score)).limit(limit).all()
    
    def get_recent_candidates(self, days: int = 30) -> List[Candidate]:
        """Get candidates added in recent days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        return self.db.query(Candidate).filter(Candidate.created_at >= cutoff_date).all()
    
    def update_candidate(self, candidate_id: int, update_data: Dict) -> Optional[Candidate]:
        """Update candidate information"""
        candidate = self.get_candidate_by_id(candidate_id)
        if candidate:
            for key, value in update_data.items():
                setattr(candidate, key, value)
            self.db.commit()
            self.db.refresh(candidate)
        return candidate
    
    def delete_candidate(self, candidate_id: int) -> bool:
        """Delete candidate"""
        candidate = self.get_candidate_by_id(candidate_id)
        if candidate:
            self.db.delete(candidate)
            self.db.commit()
            return True
        return False
    
    def get_candidates_by_status(self, status: str) -> List[Candidate]:
        """Get candidates by status"""
        return self.db.query(Candidate).filter(Candidate.status == status).all()
    
    def get_candidate_applications(self, candidate_id: int) -> List[JobApplication]:
        """Get all applications for a candidate"""
        return self.db.query(JobApplication).filter(JobApplication.candidate_id == candidate_id).all()
    
    def create_job_application(self, application_data: Dict) -> JobApplication:
        """Create a new job application"""
        application = JobApplication(**application_data)
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application
    
    def get_candidates_for_job(self, job_id: int) -> List[Candidate]:
        """Get all candidates who applied for a specific job"""
        return self.db.query(Candidate).join(JobApplication).filter(
            JobApplication.job_id == job_id
        ).all()
    
    def get_candidate_statistics(self) -> Dict:
        """Get candidate statistics"""
        total_candidates = self.db.query(Candidate).count()
        active_candidates = self.db.query(Candidate).filter(Candidate.is_available == True).count()
        recent_candidates = len(self.get_recent_candidates(30))
        
        status_counts = {}
        statuses = ['new', 'screened', 'interviewed', 'hired', 'rejected']
        for status in statuses:
            status_counts[status] = self.db.query(Candidate).filter(Candidate.status == status).count()
        
        return {
            "total_candidates": total_candidates,
            "active_candidates": active_candidates,
            "recent_candidates": recent_candidates,
            "status_breakdown": status_counts
        }