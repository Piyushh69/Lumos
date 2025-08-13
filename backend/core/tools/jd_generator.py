from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import os
import json
from datetime import datetime

class JobDescriptionGenerator:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
    
    def generate_job_description(self, requirements: dict) -> dict:
        """Generate comprehensive job description from requirements"""
        try:
            generation_prompt = f"""
            Generate a comprehensive job description based on these requirements:
            
            {json.dumps(requirements, indent=2)}
            
            Create a professional job description with:
            1. Job Title
            2. Company Overview
            3. Role Summary
            4. Key Responsibilities (5-7 points)
            5. Required Qualifications
            6. Preferred Qualifications
            7. Skills Required (technical and soft skills)
            8. Experience Level
            9. Salary Range (if provided)
            10. Benefits and Perks
            11. Location and Work Arrangement
            
            Return as structured JSON:
            {{
                "job_title": "Senior Software Engineer",
                "company_overview": "...",
                "role_summary": "...",
                "responsibilities": ["...", "..."],
                "required_qualifications": ["...", "..."],
                "preferred_qualifications": ["...", "..."],
                "technical_skills": ["...", "..."],
                "soft_skills": ["...", "..."],
                "experience_level": "3-5 years",
                "salary_range": "₹12-18 LPA",
                "benefits": ["...", "..."],
                "location": "Bangalore",
                "work_arrangement": "Hybrid"
            }}
            """
            
            response = self.llm.invoke([HumanMessage(content=generation_prompt)])
            jd_data = self._parse_json_response(response.content)
            
            # Add metadata
            jd_data["generated_at"] = datetime.now().isoformat()
            jd_data["generated_by"] = "NaviHire AI"
            jd_data["version"] = "1.0"
            
            return {
                "success": True,
                "job_description": jd_data,
                "formatted_text": self._format_jd_text(jd_data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "job_description": None
            }
    
    def optimize_jd_for_sourcing(self, jd_content: str) -> dict:
        """Optimize JD for better candidate attraction"""
        optimization_prompt = f"""
        Optimize this job description for better candidate sourcing:
        
        {jd_content}
        
        Provide:
        1. SEO keywords to include
        2. Bias-free language suggestions
        3. Inclusive language improvements
        4. Attraction factors to highlight
        5. Clarity improvements
        
        Return JSON with suggestions.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=optimization_prompt)])
            return self._parse_json_response(response.content)
        except Exception as e:
            return {"error": str(e)}
    
    def _format_jd_text(self, jd_data: dict) -> str:
        """Format JD data into readable text"""
        formatted = f"""
# {jd_data.get('job_title', 'Job Title')}

## Company Overview
{jd_data.get('company_overview', 'Company overview not provided')}

## Role Summary
{jd_data.get('role_summary', 'Role summary not provided')}

## Key Responsibilities
"""
        
        for responsibility in jd_data.get('responsibilities', []):
            formatted += f"• {responsibility}\n"
        
        formatted += f"""
## Required Qualifications
"""
        for qualification in jd_data.get('required_qualifications', []):
            formatted += f"• {qualification}\n"
        
        formatted += f"""
## Technical Skills Required
{', '.join(jd_data.get('technical_skills', []))}

## Experience Level
{jd_data.get('experience_level', 'Not specified')}

## Compensation
{jd_data.get('salary_range', 'Competitive salary')}

## Location
{jd_data.get('location', 'Not specified')} - {jd_data.get('work_arrangement', 'Not specified')}
"""
        
        return formatted
    
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
