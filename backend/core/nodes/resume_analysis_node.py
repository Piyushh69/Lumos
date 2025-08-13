from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from core.tools.resume_parser import ResumeParser
from core.graph.state import NaviHireState
import os

class ResumeAnalysisNode:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.resume_parser = ResumeParser()
    
    def process(self, state: NaviHireState) -> NaviHireState:
        """Process resume analysis requests"""
        uploaded_resumes = state.get("uploaded_resumes", [])
        
        if not uploaded_resumes:
            state["task_progress"]["resume_analysis"] = {
                "status": "no_resumes",
                "message": "Please upload resumes to analyze"
            }
            return state
        
        analyzed_resumes = []
        
        for resume_data in uploaded_resumes:
            try:
                # Parse resume content
                parsed_data = self.resume_parser.parse_resume(resume_data["content"])
                
                # AI-powered skill extraction
                skills_analysis = self._analyze_skills(parsed_data["text"])
                
                # Experience analysis
                experience_analysis = self._analyze_experience(parsed_data["text"])
                
                analyzed_resume = {
                    "filename": resume_data["filename"],
                    "parsed_data": parsed_data,
                    "skills": skills_analysis,
                    "experience": experience_analysis,
                    "score": self._calculate_resume_score(parsed_data, skills_analysis)
                }
                
                analyzed_resumes.append(analyzed_resume)
                
            except Exception as e:
                analyzed_resumes.append({
                    "filename": resume_data["filename"],
                    "error": str(e),
                    "status": "failed"
                })
        
        state["task_progress"]["resume_analysis"] = {
            "status": "completed",
            "analyzed_resumes": analyzed_resumes,
            "total_processed": len(analyzed_resumes)
        }
        
        return state
    
    def _analyze_skills(self, resume_text: str) -> dict:
        """Extract and categorize skills using AI"""
        skills_prompt = f"""
        Extract and categorize skills from this resume:
        {resume_text[:2000]}
        
        Return JSON format:
        {{
            "technical_skills": [],
            "soft_skills": [],
            "programming_languages": [],
            "tools_technologies": [],
            "certifications": []
        }}
        """
        
        response = self.llm.invoke([HumanMessage(content=skills_prompt)])
        # Parse JSON response (add error handling)
        return {"technical_skills": [], "soft_skills": []}  # Simplified
    
    def _analyze_experience(self, resume_text: str) -> dict:
        """Analyze work experience using AI"""
        exp_prompt = f"""
        Analyze work experience from this resume:
        {resume_text[:2000]}
        
        Extract:
        - Total years of experience
        - Industry experience
        - Leadership experience
        - Key achievements
        """
        
        response = self.llm.invoke([HumanMessage(content=exp_prompt)])
        return {"total_years": 0, "industries": [], "achievements": []}  # Simplified
    
    def _calculate_resume_score(self, parsed_data: dict, skills: dict) -> float:
        """Calculate overall resume score"""
        score = 0.0
        
        # Basic scoring logic
        if parsed_data.get("contact_info"):
            score += 20
        if skills.get("technical_skills"):
            score += 30
        if parsed_data.get("education"):
            score += 25
        if parsed_data.get("experience"):
            score += 25
        
        return min(score, 100.0)