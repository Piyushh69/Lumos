import PyPDF2
import docx
import re
from typing import Dict, Any
import io

class ResumeParser:
    def __init__(self):
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    
    def parse_resume(self, file_content: bytes, filename: str = "") -> Dict[str, Any]:
        """Parse resume from file content"""
        file_extension = filename.lower().split('.')[-1] if filename else 'pdf'
        
        if file_extension == 'pdf':
            text = self._extract_pdf_text(file_content)
        elif file_extension in ['doc', 'docx']:
            text = self._extract_docx_text(file_content)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
        
        return {
            "text": text,
            "contact_info": self._extract_contact_info(text),
            "education": self._extract_education(text),
            "experience": self._extract_experience(text),
            "skills": self._extract_basic_skills(text)
        }
    
    def _extract_pdf_text(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(file_content)
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Error reading PDF: {str(e)}")
    
    def _extract_docx_text(self, file_content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Error reading DOCX: {str(e)}")
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information"""
        email_match = re.search(self.email_pattern, text)
        phone_match = re.search(self.phone_pattern, text)
        
        return {
            "email": email_match.group() if email_match else "",
            "phone": phone_match.group() if phone_match else ""
        }
    
    def _extract_education(self, text: str) -> list:
        """Extract education information"""
        education_keywords = ['education', 'qualification', 'degree', 'university', 'college']
        education_section = ""
        
        lines = text.split('\n')
        in_education_section = False
        
        for line in lines:
            if any(keyword in line.lower() for keyword in education_keywords):
                in_education_section = True
            elif in_education_section and any(keyword in line.lower() for keyword in ['experience', 'work', 'employment']):
                break
            
            if in_education_section:
                education_section += line + "\n"
        
        return [education_section.strip()] if education_section.strip() else []
    
    def _extract_experience(self, text: str) -> list:
        """Extract work experience"""
        experience_keywords = ['experience', 'work', 'employment', 'career', 'professional']
        experience_section = ""
        
        lines = text.split('\n')
        in_experience_section = False
        
        for line in lines:
            if any(keyword in line.lower() for keyword in experience_keywords):
                in_experience_section = True
            elif in_experience_section and any(keyword in line.lower() for keyword in ['education', 'skills', 'projects']):
                break
            
            if in_experience_section:
                experience_section += line + "\n"
        
        return [experience_section.strip()] if experience_section.strip() else []
    
    def _extract_basic_skills(self, text: str) -> list:
        """Extract basic skills (simple keyword matching)"""
        common_skills = [
            'python', 'java', 'javascript', 'react', 'node.js', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'machine learning', 'ai',
            'project management', 'leadership', 'communication', 'teamwork'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in common_skills:
            if skill in text_lower:
                found_skills.append(skill)
        
        return found_skills