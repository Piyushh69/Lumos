from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from core.graph.state import NaviHireState
from core.tools.resume_parser import ResumeParser
from database.models.candidate import Candidate
from database.models.job import Job
import os
import json

class CandidateMatchingNode:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.resume_parser = ResumeParser()
    
    def process(self, state: NaviHireState) -> NaviHireState:
        """Process candidate matching requests"""
        try:
            job_description = state.get("job_description")
            analyzed_resumes = state.get("task_progress", {}).get("resume_analysis", {}).get("analyzed_resumes", [])
            
            if not job_description or not analyzed_resumes:
                state["task_progress"]["candidate_matching"] = {
                    "status": "missing_data",
                    "message": "Need job description and analyzed resumes for matching"
                }
                return state
            
            # Perform semantic matching
            matches = self._match_candidates_to_job(job_description, analyzed_resumes)
            
            # Rank candidates
            ranked_matches = self._rank_candidates(matches, job_description)
            
            state["candidate_matches"] = ranked_matches
            state["task_progress"]["candidate_matching"] = {
                "status": "completed",
                "total_matches": len(ranked_matches),
                "top_candidates": ranked_matches[:3]
            }
            
        except Exception as e:
            state["task_progress"]["candidate_matching"] = {
                "status": "error",
                "error": str(e)
            }
        
        return state
    
    def _match_candidates_to_job(self, job_description: dict, analyzed_resumes: list) -> list:
        """Match candidates to job using AI"""
        matches = []
        
        for resume in analyzed_resumes:
            try:
                matching_prompt = f"""
                Analyze the match between this candidate and job:
                
                Job Description: {json.dumps(job_description, indent=2)}
                
                Candidate Profile:
                - Skills: {resume.get('skills', {})}
                - Experience: {resume.get('experience', {})}
                - Score: {resume.get('score', 0)}
                
                Rate the match on a scale of 0-100 and provide reasoning.
                
                Return JSON:
                {{
                    "match_score": 85,
                    "reasoning": "Strong technical skills match...",
                    "strengths": ["Python", "Machine Learning"],
                    "gaps": ["Leadership experience"],
                    "recommendation": "Strong candidate for interview"
                }}
                """
                
                response = self.llm.invoke([HumanMessage(content=matching_prompt)])
                match_data = self._parse_json_response(response.content)
                
                matches.append({
                    "candidate": resume,
                    "match_score": match_data.get("match_score", 0),
                    "reasoning": match_data.get("reasoning", ""),
                    "strengths": match_data.get("strengths", []),
                    "gaps": match_data.get("gaps", []),
                    "recommendation": match_data.get("recommendation", "")
                })
                
            except Exception as e:
                matches.append({
                    "candidate": resume,
                    "match_score": 0,
                    "error": str(e)
                })
        
        return matches
    
    def _rank_candidates(self, matches: list, job_description: dict) -> list:
        """Rank candidates by match score and other factors"""
        # Sort by match score
        ranked = sorted(matches, key=lambda x: x.get("match_score", 0), reverse=True)
        
        # Add ranking information
        for i, match in enumerate(ranked, 1):
            match["rank"] = i
            match["percentile"] = round((len(ranked) - i + 1) / len(ranked) * 100, 1)
        
        return ranked
    
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
