from typing import TypedDict, Annotated, List, Optional, Dict, Any
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class NaviHireState(TypedDict):
    """Central state for NaviHire platform"""
    messages: Annotated[List[BaseMessage], add_messages]
    
    # User & Session
    user_id: str
    session_id: str
    user_role: str  # hr_manager, recruiter, admin
    
    # HR Context
    current_job_id: Optional[str]
    uploaded_resumes: List[Dict[str, Any]]
    candidate_matches: List[Dict[str, Any]]
    job_description: Optional[Dict[str, Any]]
    
    # Travel Context
    travel_requests: List[Dict[str, Any]]
    flight_results: Optional[List[Dict]]
    travel_policy: Optional[Dict[str, Any]]
    
    # Workflow State
    current_task: Optional[str]
    next_action: Optional[str]
    task_progress: Dict[str, Any]
    
    # Analytics
    hr_metrics: Dict[str, Any]
    travel_metrics: Dict[str, Any]
    
    # Memory & Context
    conversation_history: List[Dict]
    user_preferences: Dict[str, Any]
