import os
import base64
import json
from typing import Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import PyPDF2
import docx
import io
import re
from datetime import datetime

class GeminiResumeParser:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.llm = None
        
        if self.gemini_api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash-lite",
                    temperature=0.3,
                    google_api_key=self.gemini_api_key
                )
                print("✅ Gemini AI initialized for resume parsing")
            except Exception as e:
                print(f"⚠️ Gemini initialization failed: {e}")
                self.llm = None
        else:
            print("⚠️ Gemini API key not found, using fallback parsing")
    
    def parse_resume(self, file_content: bytes, filename: str) -> Dict:
        """Parse resume using Gemini AI with fallback to basic parsing"""
        try:
            # Extract text from file
            extracted_text = self._extract_text_from_content(file_content, filename)
            
            if not extracted_text or len(extracted_text.strip()) < 50:
                raise Exception("Could not extract meaningful text from resume")
            
            # Try Gemini parsing first
            if self.llm:
                try:
                    gemini_result = self._parse_with_gemini(extracted_text, filename)
                    if gemini_result and gemini_result.get("success"):
                        print(f"✅ Gemini parsing successful for {filename}")
                        return gemini_result
                    else:
                        print(f"⚠️ Gemini parsing failed, using fallback for {filename}")
                except Exception as e:
                    print(f"⚠️ Gemini error: {e}, using fallback for {filename}")
            
            # Fallback to basic parsing
            print(f"🔄 Using fallback parsing for {filename}")
            return self._parse_with_fallback(extracted_text, filename)
            
        except Exception as e:
            print(f"❌ Resume parsing failed for {filename}: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def _parse_with_gemini(self, text: str, filename: str) -> Dict:
        """Parse resume using Gemini AI"""
        try:
            parsing_prompt = f"""
            Analyze this resume text and extract the following information in JSON format:
            
            Resume Text:
            {text}
            
            Extract and return ONLY a valid JSON object with these fields:
            {{
                "personal_info": {{
                    "full_name": "Full name of the candidate",
                    "email": "Email address",
                    "phone": "Phone number",
                    "location": "City, State/Country",
                    "linkedin": "LinkedIn profile URL if mentioned",
                    "website": "Personal website if mentioned"
                }},
                "professional_summary": "Brief professional summary or objective",
                "skills": {{
                    "technical_skills": ["List of technical skills"],
                    "soft_skills": ["List of soft skills"],
                    "programming_languages": ["Programming languages if any"],
                    "tools_technologies": ["Tools and technologies"]
                }},
                "experience": [
                    {{
                        "company": "Company name",
                        "position": "Job title",
                        "duration": "Employment duration",
                        "description": "Brief description of role and achievements",
                        "years_calculated": 2.5
                    }}
                ],
                "education": [
                    {{
                        "institution": "School/University name",
                        "degree": "Degree type and field",
                        "graduation_year": "Year or duration",
                        "gpa": "GPA if mentioned"
                    }}
                ],
                "certifications": ["List of certifications"],
                "projects": [
                    {{
                        "name": "Project name",
                        "description": "Project description",
                        "technologies": ["Technologies used"]
                    }}
                ],
                "languages": ["Spoken languages"],
                "total_experience_years": 5.5,
                "key_achievements": ["Notable achievements or awards"]
            }}
            
            Important:
            - Return ONLY valid JSON, no additional text
            - If information is not found, use null or empty array
            - Calculate total_experience_years from work experience
            - Extract all technical skills mentioned
            - Be precise with company names and job titles
            """
            
            response = self.llm.invoke([HumanMessage(content=parsing_prompt)])
            
            # Parse JSON response
            parsed_data = self._parse_json_response(response.content)
            
            if not parsed_data:
                raise Exception("Failed to parse Gemini response as JSON")
            
            # Validate and enhance the parsed data
            validated_data = self._validate_gemini_response(parsed_data, text)
            
            return {
                "success": True,
                "source": "gemini",
                "filename": filename,
                "parsed_data": validated_data,
                "raw_text": text
            }
            
        except Exception as e:
            print(f"Gemini parsing error: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_with_fallback(self, text: str, filename: str) -> Dict:
        """Fallback parsing using regex and basic text analysis"""
        try:
            parsed_data = {
                "personal_info": {
                    "full_name": self._extract_name_fallback(text),
                    "email": self._extract_email_fallback(text),
                    "phone": self._extract_phone_fallback(text),
                    "location": self._extract_location_fallback(text),
                    "linkedin": self._extract_linkedin_fallback(text),
                    "website": self._extract_website_fallback(text)
                },
                "professional_summary": self._extract_summary_fallback(text),
                "skills": {
                    "technical_skills": self._extract_technical_skills_fallback(text),
                    "soft_skills": self._extract_soft_skills_fallback(text),
                    "programming_languages": self._extract_programming_languages_fallback(text),
                    "tools_technologies": self._extract_tools_fallback(text)
                },
                "experience": self._extract_experience_fallback(text),
                "education": self._extract_education_fallback(text),
                "certifications": self._extract_certifications_fallback(text),
                "projects": [],
                "languages": self._extract_languages_fallback(text),
                "total_experience_years": self._calculate_total_experience_fallback(text),
                "key_achievements": self._extract_achievements_fallback(text)
            }
            
            return {
                "success": True,
                "source": "fallback",
                "filename": filename,
                "parsed_data": parsed_data,
                "raw_text": text
            }
            
        except Exception as e:
            return {
                "success": False,
                "source": "fallback",
                "error": str(e),
                "filename": filename
            }
    
    def _extract_text_from_content(self, content: bytes, filename: str) -> str:
        """Extract text from various file formats"""
        try:
            file_ext = filename.lower().split('.')[-1]
            
            if file_ext == 'pdf':
                return self._extract_pdf_text(content)
            elif file_ext in ['doc', 'docx']:
                return self._extract_docx_text(content)
            elif file_ext == 'txt':
                return content.decode('utf-8', errors='ignore')
            else:
                # Try to decode as text
                return content.decode('utf-8', errors='ignore')
                
        except Exception as e:
            print(f"❌ Text extraction failed for {filename}: {e}")
            # Fallback: try to decode as text
            try:
                return content.decode('utf-8', errors='ignore')
            except:
                return ""
    
    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""
    
    def _extract_docx_text(self, content: bytes) -> str:
        """Extract text from DOCX content"""
        try:
            doc_file = io.BytesIO(content)
            doc = docx.Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            return ""
    
    def _parse_json_response(self, response_text: str) -> Dict:
        """Parse JSON response from Gemini"""
        try:
            cleaned = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned.startswith('```'):
                cleaned = cleaned[7:-3]
            elif cleaned.startswith('```'):
                cleaned = cleaned[3:-3]
            
            # Find JSON object boundaries
            start_idx = cleaned.find('{')
            end_idx = cleaned.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = cleaned[start_idx:end_idx + 1]
                return json.loads(json_str)
            
            return {}
        except Exception as e:
            print(f"Error parsing JSON response: {e}")
            return {}
    
    def _validate_gemini_response(self, data: Dict, original_text: str) -> Dict:
        """Validate and enhance Gemini response"""
        # Ensure required fields exist
        if not data.get("personal_info"):
            data["personal_info"] = {}
        
        if not data.get("skills"):
            data["skills"] = {
                "technical_skills": [],
                "soft_skills": [],
                "programming_languages": [],
                "tools_technologies": []
            }
        
        # Validate email format
        email = data["personal_info"].get("email")
        if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            data["personal_info"]["email"] = None
        
        # Validate phone format
        phone = data["personal_info"].get("phone")
        if phone:
            # Clean phone number
            cleaned_phone = re.sub(r'[^\d+\-\s()]', '', phone)
            data["personal_info"]["phone"] = cleaned_phone
        
        # Ensure experience years is numeric
        try:
            total_exp = float(data.get("total_experience_years", 0))
            data["total_experience_years"] = total_exp
        except:
            data["total_experience_years"] = 0.0
        
        return data
    
    # Fallback parsing methods
    def _extract_name_fallback(self, text: str) -> str:
        """Extract name using fallback method"""
        lines = text.split('\n')[:10]  # Check first 10 lines
        for line in lines:
            line = line.strip()
            if len(line) > 2 and len(line) < 50 and ' ' in line:
                words = line.split()
                if len(words) >= 2 and all(word.replace('.', '').isalpha() for word in words[:3]):
                    return ' '.join(words[:3])  # Take first 3 words max
        return "Unknown Name"
    
    def _extract_email_fallback(self, text: str) -> Optional[str]:
        """Extract email using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else None
    
    def _extract_phone_fallback(self, text: str) -> Optional[str]:
        """Extract phone using regex"""
        phone_patterns = [
            r'(\+91|91)?[\s-]?[6-9]\d{9}',  # Indian numbers
            r'\(\d{3}\)\s*\d{3}-\d{4}',     # US format
            r'\d{3}-\d{3}-\d{4}',           # US format
            r'\+\d{1,3}[\s-]?\d{10,14}'     # International
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        return None
    
    def _extract_location_fallback(self, text: str) -> Optional[str]:
        """Extract location using common patterns"""
        # Look for city, state patterns
        location_patterns = [
            r'([A-Z][a-z]+,\s*[A-Z][a-z]+)',  # City, State
            r'([A-Z][a-z]+,\s*[A-Z]{2})',     # City, ST
            r'([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z][a-z]+)'  # City Name, State
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        return None
    
    def _extract_linkedin_fallback(self, text: str) -> Optional[str]:
        """Extract LinkedIn URL"""
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        matches = re.findall(linkedin_pattern, text.lower())
        return f"<https://{matches>[0]}" if matches else None
    
    def _extract_website_fallback(self, text: str) -> Optional[str]:
        """Extract website URL"""
        website_patterns = [
            r'https?://[\w.-]+\.\w+',
            r'www\.[\w.-]+\.\w+'
        ]
        
        for pattern in website_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                # Filter out LinkedIn and email domains
                for match in matches:
                    if 'linkedin' not in match and '@' not in match:
                        return match
        return None
    
    def _extract_technical_skills_fallback(self, text: str) -> List[str]:
        """Extract technical skills using keyword matching"""
        technical_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js', 'express',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git',
            'html', 'css', 'bootstrap', 'tailwind', 'sass', 'less',
            'django', 'flask', 'spring', 'hibernate', 'laravel', 'rails',
            'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
            'api', 'rest', 'graphql', 'microservices', 'devops', 'ci/cd'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in technical_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        return list(set(found_skills))  # Remove duplicates
    
    def _extract_soft_skills_fallback(self, text: str) -> List[str]:
        """Extract soft skills using keyword matching"""
        soft_skills_keywords = [
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analytical', 'creative', 'adaptable', 'organized', 'detail oriented',
            'time management', 'project management', 'collaboration'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in soft_skills_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        return list(set(found_skills))
    
    def _extract_programming_languages_fallback(self, text: str) -> List[str]:
        """Extract programming languages"""
        languages = [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php',
            'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab'
        ]
        
        found_languages = []
        text_lower = text.lower()
        
        for lang in languages:
            if lang in text_lower:
                found_languages.append(lang.title())
        
        return list(set(found_languages))
    
    def _extract_tools_fallback(self, text: str) -> List[str]:
        """Extract tools and technologies"""
        tools = [
            'git', 'github', 'gitlab', 'jira', 'confluence', 'slack',
            'docker', 'kubernetes', 'jenkins', 'travis', 'circleci',
            'aws', 'azure', 'gcp', 'heroku', 'netlify', 'vercel'
        ]
        
        found_tools = []
        text_lower = text.lower()
        
        for tool in tools:
            if tool in text_lower:
                found_tools.append(tool.title())
        
        return list(set(found_tools))
    
    def _extract_summary_fallback(self, text: str) -> Optional[str]:
        """Extract professional summary"""
        lines = text.split('\n')
        
        # Look for summary sections
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Take next few lines as summary
                summary_lines = []
                for j in range(i+1, min(i+5, len(lines))):
                    if lines[j].strip() and len(lines[j].strip()) > 20:
                        summary_lines.append(lines[j].strip())
                
                if summary_lines:
                    return ' '.join(summary_lines)
        
        return None
    
    def _extract_experience_fallback(self, text: str) -> List[Dict]:
        """Extract work experience"""
        # This is a simplified extraction - in practice, you'd want more sophisticated parsing
        experience = []
        
        # Look for company names and job titles
        lines = text.split('\n')
        company_keywords = ['company', 'corporation', 'inc', 'ltd', 'llc', 'technologies', 'systems']
        
        for line in lines:
            if any(keyword in line.lower() for keyword in company_keywords):
                experience.append({
                    "company": line.strip(),
                    "position": "Position not specified",
                    "duration": "Duration not specified",
                    "description": "Description not available",
                    "years_calculated": 1.0
                })
        
        return experience[:5]  # Limit to 5 entries
    
    def _extract_education_fallback(self, text: str) -> List[Dict]:
        """Extract education information"""
        education = []
        
        # Look for degree keywords
        degree_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'institute']
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in degree_keywords):
                education.append({
                    "institution": line.strip(),
                    "degree": "Degree not specified",
                    "graduation_year": "Year not specified",
                    "gpa": None
                })
        
        return education[:3]  # Limit to 3 entries
    
    def _extract_certifications_fallback(self, text: str) -> List[str]:
        """Extract certifications"""
        cert_keywords = ['certified', 'certification', 'certificate', 'aws', 'azure', 'google cloud']
        certifications = []
        
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in cert_keywords):
                certifications.append(line.strip())
        
        return certifications[:5]  # Limit to 5 certifications
    
    def _extract_languages_fallback(self, text: str) -> List[str]:
        """Extract spoken languages"""
        languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'hindi', 'arabic']
        found_languages = []
        
        text_lower = text.lower()
        for lang in languages:
            if lang in text_lower:
                found_languages.append(lang.title())
        
        return list(set(found_languages))
    
    def _calculate_total_experience_fallback(self, text: str) -> float:
        """Calculate total experience years"""
        # Look for year patterns
        year_patterns = [
            r'(\d+)\s*(?:years?|yrs?)',
            r'(\d+)\s*(?:months?|mos?)'
        ]
        
        total_years = 0.0
        
        for pattern in year_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                if 'month' in pattern:
                    total_years += float(match) / 12
                else:
                    total_years += float(match)
        
        return min(total_years, 50.0)  # Cap at 50 years
    
    def _extract_achievements_fallback(self, text: str) -> List[str]:
        """Extract key achievements"""
        achievement_keywords = ['award', 'achievement', 'recognition', 'honor', 'winner', 'published']
        achievements = []
        
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in achievement_keywords):
                achievements.append(line.strip())
        
        return achievements[:5]  # Limit to 5 achievements