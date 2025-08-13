from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from database.models.job import Job
from database.models.candidate import JobApplication
from typing import List, Optional, Dict
from datetime import datetime, timedelta

class JobRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_job(self, job_data: Dict) -> Job:
        """Create a new job"""
        job = Job(**job_data)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job
    
    def get_job_by_id(self, job_id: int) -> Optional[Job]:
        """Get job by ID"""
        return self.db.query(Job).filter(Job.id == job_id).first()
    
    def get_all_jobs(self, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get all jobs with pagination"""
        return self.db.query(Job).offset(skip).limit(limit).all()
    
    def get_active_jobs(self) -> List[Job]:
        """Get all active jobs"""
        return self.db.query(Job).filter(Job.status == "active").all()
    
    def search_jobs(self, query: str = None, department: str = None, 
                   location: str = None, employment_type: str = None) -> List[Job]:
        """Search jobs with filters"""
        db_query = self.db.query(Job)
        
        if query:
            db_query = db_query.filter(
                or_(
                    Job.title.ilike(f"%{query}%"),
                    Job.description.ilike(f"%{query}%")
                )
            )
        
        if department:
            db_query = db_query.filter(Job.department == department)
        
        if location:
            db_query = db_query.filter(Job.location.ilike(f"%{location}%"))
        
        if employment_type:
            db_query = db_query.filter(Job.employment_type == employment_type)
        
        return db_query.all()
    
    def get_jobs_by_status(self, status: str) -> List[Job]:
        """Get jobs by status"""
        return self.db.query(Job).filter(Job.status == status).all()
    
    def get_urgent_jobs(self) -> List[Job]:
        """Get urgent priority jobs"""
        return self.db.query(Job).filter(
            and_(Job.priority == "urgent", Job.status == "active")
        ).all()
    
    def get_jobs_by_hiring_manager(self, manager_id: int) -> List[Job]:
        """Get jobs by hiring manager"""
        return self.db.query(Job).filter(Job.hiring_manager_id == manager_id).all()
    
    def update_job(self, job_id: int, update_data: Dict) -> Optional[Job]:
        """Update job information"""
        job = self.get_job_by_id(job_id)
        if job:
            for key, value in update_data.items():
                setattr(job, key, value)
            self.db.commit()
            self.db.refresh(job)
        return job
    
    def delete_job(self, job_id: int) -> bool:
        """Delete job"""
        job = self.get_job_by_id(job_id)
        if job:
            self.db.delete(job)
            self.db.commit()
            return True
        return False
    
    def get_job_applications(self, job_id: int) -> List[JobApplication]:
        """Get all applications for a job"""
        return self.db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    
    def get_job_application_count(self, job_id: int) -> int:
        """Get application count for a job"""
        return self.db.query(JobApplication).filter(JobApplication.job_id == job_id).count()
    
    def get_jobs_expiring_soon(self, days: int = 7) -> List[Job]:
        """Get jobs expiring within specified days"""
        cutoff_date = datetime.now() + timedelta(days=days)
        return self.db.query(Job).filter(
            and_(
                Job.deadline <= cutoff_date,
                Job.status == "active"
            )
        ).all()
    
    def get_job_statistics(self) -> Dict:
        """Get job statistics"""
        total_jobs = self.db.query(Job).count()
        active_jobs = self.db.query(Job).filter(Job.status == "active").count()
        draft_jobs = self.db.query(Job).filter(Job.status == "draft").count()
        closed_jobs = self.db.query(Job).filter(Job.status == "closed").count()
        
        # Department breakdown
        department_counts = {}
        departments = self.db.query(Job.department).distinct().all()
        for dept in departments:
            if dept[0]:
                department_counts[dept[0]] = self.db.query(Job).filter(Job.department == dept[0]).count()
        
        # Priority breakdown
        priority_counts = {}
        priorities = ['low', 'medium', 'high', 'urgent']
        for priority in priorities:
            priority_counts[priority] = self.db.query(Job).filter(Job.priority == priority).count()
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "draft_jobs": draft_jobs,
            "closed_jobs": closed_jobs,
            "department_breakdown": department_counts,
            "priority_breakdown": priority_counts
        }
    
    def get_hiring_pipeline(self, job_id: int) -> Dict:
        """Get hiring pipeline statistics for a job"""
        applications = self.get_job_applications(job_id)
        
        pipeline = {
            "total_applications": len(applications),
            "screening": 0,
            "interview": 0,
            "offer": 0,
            "hired": 0,
            "rejected": 0
        }
        
        for app in applications:
            if app.status in pipeline:
                pipeline[app.status] += 1
        
        return pipeline