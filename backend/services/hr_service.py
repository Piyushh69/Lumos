# import asyncio
# from typing import List, Dict, Optional
# from database.repositories.candidate_repo import CandidateRepository
# from database.repositories.job_repo import JobRepository
# from core.tools.resume_parser import ResumeParser
# from core.tools.email_automation import EmailAutomation
# import io
# import PyPDF2
# import docx
# import re

# class HRService:
#     def __init__(self, db_session):
#         self.db = db_session
#         self.candidate_repo = CandidateRepository(db_session)
#         self.job_repo = JobRepository(db_session)
#         self.resume_parser = ResumeParser()
#         self.email_automation = EmailAutomation()
    
#     async def process_resume_batch(self, resumes: List[Dict], job_id: Optional[int] = None) -> Dict:
#         """Process multiple resumes with enhanced error handling"""
#         results = {
#             "processed_resumes": [],
#             "failed_resumes": [],
#             "total_processed": 0,
#             "matching_results": None
#         }
        
#         print(f"🔄 Starting batch processing of {len(resumes)} resumes")
        
#         for i, resume_data in enumerate(resumes):
#             try:
#                 print(f"📝 Processing resume {i+1}/{len(resumes)}: {resume_data['filename']}")
                
#                 # Extract text from file content
#                 extracted_text = self._extract_text_from_content(
#                     resume_data["content"], 
#                     resume_data["filename"]
#                 )
                
#                 if not extracted_text or len(extracted_text.strip()) < 50:
#                     raise Exception("Could not extract meaningful text from resume")
                
#                 print(f"📄 Extracted {len(extracted_text)} characters from {resume_data['filename']}")
                
#                 # Parse resume using the resume parser
#                 parsed_data = self._parse_resume_content(extracted_text, resume_data["filename"])
                
#                 # Create candidate record
#                 candidate_data = {
#                     "full_name": self._extract_name(parsed_data),
#                     "email": parsed_data.get("email"),
#                     "phone": parsed_data.get("phone"),
#                     "location": parsed_data.get("location"),
#                     "resume_filename": resume_data["filename"],
#                     "resume_text": extracted_text,
#                     "skills": parsed_data.get("skills", []),
#                     "experience_years": parsed_data.get("experience_years", 0.0),
#                     "education": parsed_data.get("education", []),
#                     "overall_score": self._calculate_resume_score(parsed_data),
#                     "technical_score": parsed_data.get("technical_score", 0.0),
#                     "experience_score": parsed_data.get("experience_score", 0.0),
#                     "status": "new",
#                     "source": "resume_upload",
#                     "source_details": {
#                         "upload_method": "batch_upload",
#                         "file_size": resume_data.get("size", 0),
#                         "content_type": resume_data.get("content_type")
#                     }
#                 }
                
#                 print(f"👤 Candidate data prepared: {candidate_data['full_name']} ({candidate_data['email']})")
                
#                 # Check if candidate already exists
#                 existing_candidate = None
#                 if candidate_data["email"]:
#                     existing_candidate = self.candidate_repo.get_candidate_by_email(candidate_data["email"])
                
#                 if existing_candidate:
#                     print(f"🔄 Updating existing candidate: {existing_candidate.id}")
#                     candidate = self.candidate_repo.update_candidate(
#                         existing_candidate.id, 
#                         candidate_data
#                     )
#                 else:
#                     print(f"➕ Creating new candidate")
#                     candidate = self.candidate_repo.create_candidate(candidate_data)
                
#                 results["processed_resumes"].append({
#                     "candidate_id": candidate.id,
#                     "filename": resume_data["filename"],
#                     "candidate_name": candidate.full_name,
#                     "email": candidate.email,
#                     "status": "success",
#                     "score": candidate.overall_score,
#                     "skills_count": len(candidate.skills) if candidate.skills else 0,
#                     "experience_years": candidate.experience_years
#                 })
                
#                 # Create job application if job_id provided
#                 if job_id and candidate:
#                     try:
#                         application = self.candidate_repo.create_job_application({
#                             "candidate_id": candidate.id,
#                             "job_id": job_id,
#                             "status": "applied",
#                             "application_date": datetime.utcnow()
#                         })
#                         print(f"📋 Created job application: {application.id}")
#                     except Exception as e:
#                         print(f"⚠️ Failed to create job application: {e}")
                
#                 print(f"✅ Successfully processed: {candidate.full_name}")
                
#             except Exception as e:
#                 print(f"❌ Error processing {resume_data['filename']}: {e}")
#                 results["failed_resumes"].append({
#                     "filename": resume_data["filename"],
#                     "error": str(e),
#                     "error_type": type(e).__name__
#                 })
        
#         results["total_processed"] = len(results["processed_resumes"])
        
#         print(f"🎯 Batch processing complete: {results['total_processed']} successful, {len(results['failed_resumes'])} failed")
        
#         # Perform matching if job specified and we have processed resumes
#         if job_id and results["processed_resumes"]:
#             try:
#                 print(f"🔍 Starting candidate matching for job {job_id}")
#                 matching_result = await self._match_candidates_to_job(job_id)
#                 results["matching_results"] = matching_result
#                 print(f"🎯 Matching complete: {len(matching_result.get('matches', []))} matches found")
#             except Exception as e:
#                 print(f"⚠️ Matching failed: {e}")
#                 results["matching_error"] = str(e)
        
#         return results
    
#     def _extract_text_from_content(self, content: bytes, filename: str) -> str:
#         """Extract text from various file formats"""
#         try:
#             file_ext = filename.lower().split('.')[-1]
            
#             if file_ext == 'pdf':
#                 return self._extract_pdf_text(content)
#             elif file_ext in ['doc', 'docx']:
#                 return self._extract_docx_text(content)
#             elif file_ext == 'txt':
#                 return content.decode('utf-8', errors='ignore')
#             else:
#                 # Try to decode as text
#                 return content.decode('utf-8', errors='ignore')
                
#         except Exception as e:
#             print(f"❌ Text extraction failed for {filename}: {e}")
#             # Fallback: try to decode as text
#             try:
#                 return content.decode('utf-8', errors='ignore')
#             except:
#                 return ""
    
#     def _extract_pdf_text(self, content: bytes) -> str:
#         """Extract text from PDF content"""
#         try:
#             pdf_file = io.BytesIO(content)
#             pdf_reader = PyPDF2.PdfReader(pdf_file)
            
#             text = ""
#             for page in pdf_reader.pages:
#                 text += page.extract_text() + "\n"
            
#             return text
#         except Exception as e:
#             print(f"PDF extraction error: {e}")
#             return ""
    
#     def _extract_docx_text(self, content: bytes) -> str:
#         """Extract text from DOCX content"""
#         try:
#             doc_file = io.BytesIO(content)
#             doc = docx.Document(doc_file)
            
#             text = ""
#             for paragraph in doc.paragraphs:
#                 text += paragraph.text + "\n"
            
#             return text
#         except Exception as e:
#             print(f"DOCX extraction error: {e}")
#             return ""
    
#     def _parse_resume_content(self, text: str, filename: str) -> Dict:
#         """Parse resume text to extract structured information"""
#         try:
#             # Use the resume parser if available
#             if hasattr(self.resume_parser, 'parse_text'):
#                 return self.resume_parser.parse_text(text)
#             else:
#                 # Fallback parsing
#                 return self._basic_resume_parsing(text)
#         except Exception as e:
#             print(f"Resume parsing error: {e}")
#             return self._basic_resume_parsing(text)
    
#     def _basic_resume_parsing(self, text: str) -> Dict:
#         """Basic resume parsing fallback"""
#         parsed = {
#             "email": None,
#             "phone": None,
#             "location": None,
#             "skills": [],
#             "experience_years": 0.0,
#             "education": [],
#             "technical_score": 0.0,
#             "experience_score": 0.0
#         }
        
#         # Extract email
#         email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
#         if email_match:
#             parsed["email"] = email_match.group()
        
#         # Extract phone
#         phone_match = re.search(r'(\+91|91)?[\s-]?[6-9]\d{9}', text)
#         if phone_match:
#             parsed["phone"] = phone_match.group()
        
#         # Extract basic skills (common programming languages and technologies)
#         skill_keywords = [
#             'python', 'java', 'javascript', 'react', 'angular', 'node.js', 'sql', 'mysql',
#             'postgresql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes', 'git',
#             'html', 'css', 'bootstrap', 'django', 'flask', 'spring', 'hibernate'
#         ]
        
#         found_skills = []
#         text_lower = text.lower()
#         for skill in skill_keywords:
#             if skill in text_lower:
#                 found_skills.append(skill.title())
        
#         parsed["skills"] = found_skills
        
#         # Basic experience calculation (count years mentioned)
#         years_matches = re.findall(r'(\d+)[\s-]*(?:years?|yrs?)', text.lower())
#         if years_matches:
#             parsed["experience_years"] = float(max(years_matches))
        
#         # Basic scoring
#         parsed["technical_score"] = min(len(found_skills) * 10, 100)
#         parsed["experience_score"] = min(parsed["experience_years"] * 20, 100)
        
#         return parsed
    
#     def _extract_name(self, parsed_data: Dict) -> str:
#         """Extract candidate name from parsed resume data"""
#         # This would be enhanced with better name extraction logic
#         return "Candidate Details"  # Placeholder
    
#     def _calculate_resume_score(self, parsed_data: Dict) -> float:
#         """Calculate overall resume score"""
#         score = 0.0
        
#         # Contact information (20 points)
#         if parsed_data.get("email"):
#             score += 20
        
#         # Skills (40 points)
#         skills_count = len(parsed_data.get("skills", []))
#         score += min(skills_count * 5, 40)
        
#         # Experience (40 points)
#         experience_years = parsed_data.get("experience_years", 0)
#         score += min(experience_years * 8, 40)
        
#         return min(score, 100.0)
    
#     async def _match_candidates_to_job(self, job_id: int) -> Dict:
#         """Match processed candidates to job"""
#         # Implementation would use the matching node
#         return {"matches": [], "job_id": job_id}

import asyncio
from typing import List, Dict, Optional
from sqlalchemy.exc import IntegrityError
from database.models.candidate import Candidate, JobApplication
from database.models.job import Job
from core.tools.gemini_resume_parser import GeminiResumeParser
from core.tools.email_automation import EmailAutomation
from datetime import datetime


class HRService:
    def __init__(self, db_session):
        self.db = db_session
        self.resume_parser = GeminiResumeParser()
        self.email_automation = EmailAutomation()
    
    async def process_resume_batch(self, resumes: List[Dict], job_id: Optional[int] = None) -> Dict:
        """Process multiple resumes with Gemini AI and fallback"""
        results = {
            "processed_resumes": [],
            "failed_resumes": [],
            "total_processed": 0,
            "parsing_method_stats": {"gemini": 0, "fallback": 0},
            "matching_results": None
        }
        
        print(f"🔄 Starting batch processing of {len(resumes)} resumes with Gemini AI")
        
        for i, resume_data in enumerate(resumes):
            try:
                print(f"📝 Processing resume {i+1}/{len(resumes)}: {resume_data['filename']}")
                
                # Parse resume using Gemini with fallback
                parse_result = self.resume_parser.parse_resume(
                    resume_data["content"], 
                    resume_data["filename"]
                )
                
                if not parse_result.get("success"):
                    raise Exception(f"Resume parsing failed: {parse_result.get('error', 'Unknown error')}")
                
                parsed_data = parse_result["parsed_data"]
                parsing_source = parse_result["source"]
                
                # Update stats
                results["parsing_method_stats"][parsing_source] += 1
                
                print(f"✅ Parsed with {parsing_source}: {parsed_data['personal_info'].get('full_name', 'Unknown')}")
                
                # Create candidate record from parsed data
                candidate_data = self._convert_parsed_data_to_candidate(parsed_data, resume_data)
                
                print(f"👤 Candidate data prepared: {candidate_data['full_name']} ({candidate_data.get('email', 'No email')})")
                
                # Check if candidate already exists by email
                existing_candidate = None
                if candidate_data.get("email"):
                    existing_candidate = self.db.query(Candidate).filter(
                        Candidate.email == candidate_data["email"]
                    ).first()
                
                if existing_candidate:
                    print(f"🔄 Updating existing candidate: {existing_candidate.id}")
                    # Update existing candidate
                    for key, value in candidate_data.items():
                        if hasattr(existing_candidate, key) and value is not None:
                            setattr(existing_candidate, key, value)
                    
                    existing_candidate.updated_at = datetime.utcnow()
                    self.db.commit()
                    self.db.refresh(existing_candidate)
                    candidate = existing_candidate
                else:
                    print(f"➕ Creating new candidate")
                    # Create new candidate
                    candidate = Candidate(**candidate_data)
                    self.db.add(candidate)
                    self.db.commit()
                    self.db.refresh(candidate)
                
                results["processed_resumes"].append({
                    "candidate_id": candidate.id,
                    "filename": resume_data["filename"],
                    "candidate_name": candidate.full_name,
                    "email": candidate.email,
                    "status": "success",
                    "score": candidate.overall_score,
                    "skills_count": len(candidate.skills) if candidate.skills else 0,
                    "experience_years": candidate.experience_years,
                    "parsing_method": parsing_source,
                    "technical_skills": parsed_data["skills"].get("technical_skills", []),
                    "programming_languages": parsed_data["skills"].get("programming_languages", [])
                })
                
                # Create job application if job_id provided
                if job_id and candidate:
                    try:
                        # Check if application already exists
                        existing_application = self.db.query(JobApplication).filter(
                            JobApplication.candidate_id == candidate.id,
                            JobApplication.job_id == job_id
                        ).first()
                        
                        if not existing_application:
                            application = JobApplication(
                                candidate_id=candidate.id,
                                job_id=job_id,
                                status="applied",
                                application_date=datetime.utcnow()
                            )
                            self.db.add(application)
                            self.db.commit()
                            print(f"📋 Created job application: {application.id}")
                        else:
                            print(f"📋 Job application already exists: {existing_application.id}")
                            
                    except Exception as e:
                        print(f"⚠️ Failed to create job application: {e}")
                        self.db.rollback()
                
                print(f"✅ Successfully processed: {candidate.full_name}")
                
            except IntegrityError as e:
                print(f"💫 Database integrity error for {resume_data['filename']}: {e}")
                self.db.rollback()
                results["failed_resumes"].append({
                    "filename": resume_data["filename"],
                    "error": "Duplicate candidate or database constraint violation",
                    "error_type": "IntegrityError"
                })
            except Exception as e:
                print(f"❌ Error processing {resume_data['filename']}: {e}")
                self.db.rollback()
                results["failed_resumes"].append({
                    "filename": resume_data["filename"],
                    "error": str(e),
                    "error_type": type(e).__name__
                })
        
        results["total_processed"] = len(results["processed_resumes"])
        
        print(f"🎯 Batch processing complete:")
        print(f"   ✅ Successful: {results['total_processed']}")
        print(f"   ❌ Failed: {len(results['failed_resumes'])}")
        print(f"   🤖 Gemini parsed: {results['parsing_method_stats']['gemini']}")
        print(f"   🔄 Fallback parsed: {results['parsing_method_stats']['fallback']}")
        
        # Perform matching if job specified and we have processed resumes
        if job_id and results["processed_resumes"]:
            try:
                print(f"🔍 Starting candidate matching for job {job_id}")
                matching_result = await self._match_candidates_to_job(job_id)
                results["matching_results"] = matching_result
                print(f"🎯 Matching complete: {len(matching_result.get('matches', []))} matches found")
            except Exception as e:
                print(f"⚠️ Matching failed: {e}")
                results["matching_error"] = str(e)
        
        return results
    
    def _convert_parsed_data_to_candidate(self, parsed_data: Dict, resume_data: Dict) -> Dict:
        """Convert parsed resume data to candidate database format using your Candidate model fields"""
        personal_info = parsed_data.get("personal_info", {})
        skills_data = parsed_data.get("skills", {})
        
        # Combine all skills into a list for JSON field
        all_skills = []
        all_skills.extend(skills_data.get("technical_skills", []))
        all_skills.extend(skills_data.get("programming_languages", []))
        all_skills.extend(skills_data.get("tools_technologies", []))
        all_skills.extend(skills_data.get("soft_skills", []))
        
        # Remove duplicates and clean
        unique_skills = list(set([skill.strip() for skill in all_skills if skill.strip()]))
        
        # Calculate scores
        technical_score = min(len(skills_data.get("technical_skills", [])) * 10, 100)
        experience_score = min(parsed_data.get("total_experience_years", 0) * 20, 100)
        overall_score = self._calculate_overall_score(parsed_data)
        
        # Map to your Candidate model fields
        candidate_data = {
            "full_name": personal_info.get("full_name", "Unknown Name"),
            "email": personal_info.get("email"),
            "phone": personal_info.get("phone"),
            "location": personal_info.get("location"),
            "resume_filename": resume_data["filename"],
            "resume_text": parsed_data.get("raw_text", ""),
            "skills": unique_skills,  # JSON array field
            "experience_years": float(parsed_data.get("total_experience_years", 0)),
            "education": parsed_data.get("education", []),  # JSON array field
            "certifications": parsed_data.get("certifications", []),  # JSON array field
            "overall_score": float(overall_score),
            "technical_score": float(technical_score),
            "experience_score": float(experience_score),
            "status": "new",
            "is_available": True,
            "source": "resume_upload",
            "source_details": {  # JSON field
                "upload_method": "batch_upload",
                "file_size": resume_data.get("size", 0),
                "content_type": resume_data.get("content_type"),
                "parsing_method": parsed_data.get("source", "unknown"),
                "professional_summary": parsed_data.get("professional_summary"),
                "linkedin": personal_info.get("linkedin"),
                "website": personal_info.get("website"),
                "languages": parsed_data.get("languages", []),
                "key_achievements": parsed_data.get("key_achievements", [])
            }
        }
        
        return candidate_data
    
    def _calculate_overall_score(self, parsed_data: Dict) -> float:
        """Calculate overall candidate score based on parsed data"""
        score = 0.0
        
        # Contact information (20 points)
        personal_info = parsed_data.get("personal_info", {})
        if personal_info.get("email"):
            score += 20
        
        # Skills (40 points)
        skills_data = parsed_data.get("skills", {})
        total_skills = (
            len(skills_data.get("technical_skills", [])) +
            len(skills_data.get("programming_languages", [])) +
            len(skills_data.get("tools_technologies", []))
        )
        score += min(total_skills * 3, 40)
        
        # Experience (30 points)
        experience_years = parsed_data.get("total_experience_years", 0)
        score += min(experience_years * 6, 30)
        
        # Education (10 points)
        education = parsed_data.get("education", [])
        if education:
            score += 10
        
        return min(score, 100.0)
    
    async def _match_candidates_to_job(self, job_id: int) -> Dict:
        """Match processed candidates to job"""
        try:
            # Get job details
            job = self.db.query(Job).filter(Job.id == job_id).first()
            if not job:
                return {"matches": [], "job_id": job_id, "error": "Job not found"}
            
            # Get recent candidates for this job
            recent_candidates = self.db.query(Candidate).join(JobApplication).filter(
                JobApplication.job_id == job_id
            ).all()
            
            matches = []
            for candidate in recent_candidates:
                match_score = self._calculate_match_score(candidate, job)
                matches.append({
                    "candidate_id": candidate.id,
                    "candidate_name": candidate.full_name,
                    "match_score": match_score,
                    "overall_score": candidate.overall_score,
                    "key_skills": candidate.skills[:5] if candidate.skills else []
                })
            
            # Sort by match score
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            
            return {
                "matches": matches,
                "job_id": job_id,
                "job_title": job.title if hasattr(job, 'title') else 'Unknown',
                "total_matches": len(matches)
            }
            
        except Exception as e:
            return {"matches": [], "job_id": job_id, "error": str(e)}
    
    def _calculate_match_score(self, candidate: Candidate, job: Job) -> float:
        """Calculate how well a candidate matches a job"""
        # Basic matching logic - you can enhance this
        base_score = candidate.overall_score or 0
        
        # Add bonus for experience
        if hasattr(job, 'required_experience') and job.required_experience:
            if candidate.experience_years >= job.required_experience:
                base_score += 10
        
        # Add bonus for relevant skills (if job has required skills)
        if hasattr(job, 'required_skills') and job.required_skills and candidate.skills:
            job_skills = [skill.lower() for skill in job.required_skills]
            candidate_skills = [skill.lower() for skill in candidate.skills]
            skill_matches = len(set(job_skills) & set(candidate_skills))
            skill_bonus = min(skill_matches * 5, 20)
            base_score += skill_bonus
        
        return min(base_score, 100.0)
    
    # Additional helper methods
    def get_candidate_by_id(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate by ID"""
        return self.db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    def get_candidates_by_job(self, job_id: int) -> List[Candidate]:
        """Get all candidates for a specific job"""
        return self.db.query(Candidate).join(JobApplication).filter(
            JobApplication.job_id == job_id
        ).all()
    
    def update_candidate_status(self, candidate_id: int, status: str) -> bool:
        """Update candidate status"""
        try:
            candidate = self.db.query(Candidate).filter(Candidate.id == candidate_id).first()
            if candidate:
                candidate.status = status
                candidate.updated_at = datetime.utcnow()
                self.db.commit()
                return True
            return False
        except Exception as e:
            print(f"❌ Error updating candidate status: {e}")
            self.db.rollback()
            return False
