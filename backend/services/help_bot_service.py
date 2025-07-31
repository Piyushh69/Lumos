from typing import Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import os
import json
import re

class HelpBotService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        print("api_key",api_key)
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            # model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=api_key
        )
        
        self.navigation_map = {
            "resume upload": "/resume-upload",
            "candidate database": "/candidate-database", 
            "candidate matching": "/candidate-matching",
            "interview scheduler": "/interview-scheduler",
            "flight search": "/flight-search",
            "travel dashboard": "/travel-dashboard",
            "job generator": "/job-generator",
            "test scheduler": "/test-scheduler",
            "email automation": "/email-automation",
            "hr metrics": "/hr-metrics",
            "roi analytics": "/roi-analytics",
            "travel metrics": "/travel-metrics"
        }
        
        self.feature_help = {
            "resume upload": {
                "description": "Upload and analyze resumes with AI-powered parsing",
                "steps": [
                    "Click 'Resume Upload' in the sidebar",
                    "Drag and drop PDF/DOC files or click to select",
                    "Optionally enter a Job ID for automatic matching",
                    "Click 'Upload & Analyze with AI' to process"
                ]
            },
            "email automation": {
                "description": "Create and send automated email campaigns",
                "steps": [
                    "Go to Email Automation section",
                    "Choose 'Compose Email' tab",
                    "Select a template or create custom",
                    "Fill in recipient details and variables",
                    "Send immediately or schedule for later"
                ]
            },
            "flight search": {
                "description": "Search and compare flights with real-time pricing",
                "steps": [
                    "Navigate to Flight Search",
                    "Enter origin and destination cities",
                    "Select travel dates",
                    "Click 'Search Flights' to see options",
                    "Compare prices and book directly"
                ]
            }
        }
    
    def process_help_request(self, message: str, context) -> Dict:
        """Process help request and generate response"""
        try:
            # Analyze user intent
            intent = self._analyze_intent(message, context)
            
            # Generate appropriate response
            if intent["type"] == "navigation":
                return self._handle_navigation_request(intent, message)
            elif intent["type"] == "how_to":
                return self._handle_how_to_request(intent, message)
            elif intent["type"] == "general":
                return self._handle_general_request(message, context)
            else:
                return self._handle_fallback_request(message)
                
        except Exception as e:
            return {
                "response": "I apologize, but I encountered an error. Please try rephrasing your question or contact support.",
                "actions": []
            }
    
    def _analyze_intent(self, message: str, context: Dict) -> Dict:
        """Analyze user intent from message"""
        message_lower = message.lower()
        
        # Check for navigation intent
        for feature, path in self.navigation_map.items():
            if feature in message_lower or any(word in message_lower for word in feature.split()):
                return {
                    "type": "navigation",
                    "feature": feature,
                    "path": path
                }
        
        # Check for how-to intent
        how_to_keywords = ["how to", "how do i", "help me", "guide", "tutorial", "steps"]
        if any(keyword in message_lower for keyword in how_to_keywords):
            for feature in self.feature_help.keys():
                if feature in message_lower:
                    return {
                        "type": "how_to",
                        "feature": feature
                    }
            return {"type": "how_to", "feature": None}
        
        # Check for general questions
        general_keywords = ["what is", "explain", "tell me about", "navihire", "platform"]
        if any(keyword in message_lower for keyword in general_keywords):
            return {"type": "general"}
        
        return {"type": "unknown"}
    
    def _handle_navigation_request(self, intent: Dict, message: str) -> Dict:
        """Handle navigation requests"""
        feature = intent["feature"]
        path = intent["path"]
        
        response = f"I'll help you navigate to {feature.title()}! Click the button below to go there directly."
        
        actions = [
            {
                "label": f"Go to {feature.title()}",
                "action": "navigate",
                "target": path
            }
        ]
        
        # Add related features
        if "resume" in feature:
            actions.append({
                "label": "📊 View Candidate Database",
                "action": "navigate", 
                "target": "/candidate-database"
            })
        elif "email" in feature:
            actions.append({
                "label": "📝 Create Templates",
                "action": "navigate",
                "target": "/email-automation?tab=templates"
            })
        elif "flight" in feature:
            actions.append({
                "label": "🗺️ Travel Dashboard", 
                "action": "navigate",
                "target": "/travel-dashboard"
            })
        
        return {"response": response, "actions": actions}
    
    def _handle_how_to_request(self, intent: Dict, message: str) -> Dict:
        """Handle how-to requests"""
        feature = intent.get("feature")
        
        if feature and feature in self.feature_help:
            help_info = self.feature_help[feature]
            
            response = f"Here's how to use {feature.title()}:\n\n"
            response += f"{help_info['description']}\n\n"
            response += "Steps:\n"
            
            for i, step in enumerate(help_info["steps"], 1):
                response += f"{i}. {step}\n"
            
            actions = [
                {
                    "label": f"Go to {feature.title()}",
                    "action": "navigate",
                    "target": self.navigation_map.get(feature, "/")
                }
            ]
        else:
            response = """I can help you with these features:

📄 **Resume Upload** - AI-powered resume analysis and parsing
📧 **Email Automation** - Template-based email campaigns  
✈️ **Flight Search** - Real-time flight comparison and booking
📝 **Test Scheduler** - Automated candidate assessments
🎯 **Candidate Matching** - AI-driven job-candidate matching
📊 **Analytics** - HR and travel metrics and insights

What would you like to learn about?"""
            
            actions = [
                {"label": "📄 Resume Upload Guide", "action": "navigate", "target": "/resume-upload"},
                {"label": "📧 Email Automation", "action": "navigate", "target": "/email-automation"},
                {"label": "✈️ Flight Search", "action": "navigate", "target": "/flight-search"}
            ]
        
        return {"response": response, "actions": actions}
    
    def _handle_general_request(self, message: str, context: Dict) -> Dict:
        """Handle general questions about NaviHire"""
        try:
            general_prompt = f"""
            You are a helpful assistant for NaviHire, an AI-powered platform that combines HR management and corporate travel optimization.

            NaviHire Features:
            - Resume Upload & AI Analysis: Parse resumes, extract skills, score candidates
            - Email Automation: Template-based campaigns for recruitment communication  
            - Flight Search: Real-time flight comparison with cost optimization
            - Test Scheduler: Integration with Mettl platform for candidate assessments
            - Candidate Matching: AI-driven job-candidate compatibility analysis
            - Travel Dashboard: Corporate travel management and policy compliance
            - Analytics: Comprehensive HR and travel metrics

            User Question: {message}
            Current Page: {context.get('currentPage', 'unknown')}

            Provide a helpful, concise response about NaviHire. If the user asks about specific features, explain them clearly.
            """
            
            response = self.llm.invoke([HumanMessage(content=general_prompt)])
            
            return {
                "response": response.content,
                "actions": [
                    {"label": "📊 View Dashboard", "action": "navigate", "target": "/dashboard"},
                    {"label": "📚 Documentation", "action": "external", "target": "https://docs.navikenz.com"}
                ]
            }
            
        except Exception as e:
            return self._handle_fallback_request(message)
    
    def _handle_fallback_request(self, message: str) -> Dict:
        """Handle unknown requests"""
        response = """I'm here to help you with NaviHire! I can assist with:

🔍 Navigation - "Take me to resume upload" or "Show me email automation"
❓ How-to Guides - "How do I upload resumes?" or "Help me search flights"  
💡 General Questions - Ask about any NaviHire feature or functionality

What would you like help with?"""
        
        actions = [
            {"label": "📄 Resume Upload", "action": "navigate", "target": "/resume-upload"},
            {"label": "📧 Email Automation", "action": "navigate", "target": "/email-automation"},
            {"label": "📊 Dashboard", "action": "navigate", "target": "/dashboard"}
        ]
        
        return {"response": response, "actions": actions}