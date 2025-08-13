from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from core.graph.state import NaviHireState
from core.nodes.resume_analysis_node import ResumeAnalysisNode
from core.nodes.candidate_matching_node import CandidateMatchingNode
from core.nodes.travel_optimization_node import TravelOptimizationNode
from core.nodes.workflow_automation_node import WorkflowAutomationNode
from core.agents.supervisor import NaviHireSupervisor
import os

def create_navihire_workflow():
    """Create the main NaviHire workflow graph"""
    
    # Initialize nodes
    resume_node = ResumeAnalysisNode()
    matching_node = CandidateMatchingNode()
    travel_node = TravelOptimizationNode()
    workflow_node = WorkflowAutomationNode()
    supervisor = NaviHireSupervisor()
    
    # Create workflow
    workflow = StateGraph(NaviHireState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor.analyze_intent)
    workflow.add_node("resume_analysis", resume_node.process)
    workflow.add_node("candidate_matching", matching_node.process)
    workflow.add_node("travel_optimization", travel_node.process)
    workflow.add_node("workflow_automation", workflow_node.process)
    workflow.add_node("response_generation", supervisor.generate_response)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add conditional routing
    def route_based_on_intent(state: NaviHireState) -> str:
        next_action = state.get("next_action", "response_generation")
        
        route_map = {
            "resume_analysis": "resume_analysis",
            "candidate_matching": "candidate_matching",
            "travel_optimization": "travel_optimization", 
            "workflow_automation": "workflow_automation",
            "direct_response": "response_generation"
        }
        
        return route_map.get(next_action, "response_generation")
    
    workflow.add_conditional_edges(
        "supervisor",
        route_based_on_intent,
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
    
    # Compile with checkpointer if available
    try:
        checkpointer = PostgresSaver.from_conn_string(os.getenv("DATABASE_URL"))
        return workflow.compile(checkpointer=checkpointer)
    except:
        return workflow.compile()

# Create the compiled graph
navihire_graph = create_navihire_workflow()