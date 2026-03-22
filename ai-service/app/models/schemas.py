from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ScoresInput(BaseModel):
    hireability_score: float
    consistency_score: float
    visibility_score: float
    growth_score: float
    problem_solving_score: float
    development_score: float
    social_presence_score: float
    behavior_type: str
    all_skills: List[str]
    platform_breakdown: Dict[str, Any] = {}


class AnalysisInput(BaseModel):
    patterns: Dict[str, Any]
    skills: Dict[str, Any]
    growth: Dict[str, Any]


class AnalyzeRequest(BaseModel):
    scores: ScoresInput
    analysis: AnalysisInput
    platforms: List[str]


class InsightResponse(BaseModel):
    persona: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    skill_gaps: List[str]
    career_path: str
    generated_by: str = "rule-based"


class ResumeRequest(BaseModel):
    resume_text: str
    user_skills: List[str]


class ResumeResponse(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    resume_score: float
    suggestions: List[str]
    skill_gap_analysis: str
    generated_by: str = "rule-based"
