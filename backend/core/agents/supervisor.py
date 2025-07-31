from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from core.graph.state import NaviHireState
from core.nodes.resume_analysis_node import ResumeAnalysisNode
from core.nodes.candidate_matching_node import CandidateMatchingNode
from core.nodes.travel_optimization_node import TravelOptimizationNode
from core.nodes.workflow_automation_node import WorkflowAutomationNode
import os
from dotenv import load_dotenv

load_dotenv()

class NaviHireSupervisor:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            google_api_key=api_key 
        )
        
        # Initialize nodes
        self.resume_node = ResumeAnalysisNode()
        self.matching_node = CandidateMatchingNode()
        self.travel_node = TravelOptimizationNode()
        self.workflow_node = WorkflowAutomationNode()
        
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the NaviHire workflow graph"""
        workflow = StateGraph(NaviHireState)
        
        # Add nodes
        workflow.add_node("intent_analysis", self.analyze_intent)
        workflow.add_node("resume_analysis", self.resume_node.process)
        workflow.add_node("candidate_matching", self.matching_node.process)
        workflow.add_node("travel_optimization", self.travel_node.process)
        workflow.add_node("workflow_automation", self.workflow_node.process)
        workflow.add_node("response_generation", self.generate_response)
        
        # Set entry point
        workflow.set_entry_point("intent_analysis")
        
        # Add conditional routing
        workflow.add_conditional_edges(
            "intent_analysis",
            self.route_based_on_intent,
            {
                "resume_analysis": "resume_analysis",
                "candidate_matching": "candidate_matching", 
                "travel_optimization": "travel_optimization",
                "workflow_automation": "workflow_automation",
                "direct_response": "response_generation"
            }
        )
        
        # All nodes lead to response generation
        workflow.add_edge("resume_analysis", "response_generation")
        workflow.add_edge("candidate_matching", "response_generation")
        workflow.add_edge("travel_optimization", "response_generation")
        workflow.add_edge("workflow_automation", "response_generation")
        workflow.add_edge("response_generation", END)
        
        return workflow.compile()
    
    def analyze_intent(self, state: NaviHireState) -> NaviHireState:
        """Analyze user intent and determine routing"""
        last_message = state["messages"][-1].content
        user_role = state.get("user_role", "hr_manager")
        
        intent_prompt = f"""
        Analyze this HR/Travel request from a {user_role}:
        "{last_message}"
        
        Classify intent as:
        1. resume_analysis - uploading/analyzing resumes
        2. candidate_matching - matching candidates to jobs
        3. travel_optimization - flight search, travel booking
        4. workflow_automation - scheduling, emails, approvals
        5. direct_response - general questions, greetings
        
        Respond with just the intent name.
        """
        
        response = self.llm.invoke([HumanMessage(content=intent_prompt)])
        intent = response.content.strip().lower()
        
        state["next_action"] = intent
        return state
    
    def route_based_on_intent(self, state: NaviHireState) -> str:
        """Route to appropriate node based on intent"""
        return state.get("next_action", "direct_response")
    
    def generate_response(self, state: NaviHireState) -> NaviHireState:
        """Generate final response to user"""
        last_message = state["messages"][-1].content
        task_results = state.get("task_progress", {})
        
        response_prompt = f"""
        Generate a professional HR assistant response for:
        User request: "{last_message}"
        Task results: {task_results}
        
        Be helpful, professional, and action-oriented.
        """
        
        response = self.llm.invoke([HumanMessage(content=response_prompt)])
        state["messages"].append(AIMessage(content=response.content))
        
        return state