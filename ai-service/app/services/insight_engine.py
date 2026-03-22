from app.models.schemas import AnalyzeRequest, InsightResponse
from app.core.config import settings
from typing import List


def _rule_based_insights(req: AnalyzeRequest) -> InsightResponse:
    scores = req.scores
    analysis = req.analysis
    skills = analysis.skills
    growth = analysis.growth
    patterns = analysis.patterns

    # Persona generation
    behavior = scores.behavior_type
    consistency = patterns.get("consistency", "medium")
    growth_vel = growth.get("growth_velocity", "moderate")
    top_skills = scores.all_skills[:3]
    skill_str = ", ".join(top_skills) if top_skills else "various technologies"

    persona = (
        f"You are a {behavior.lower()} with {consistency} consistency and {growth_vel} growth velocity. "
        f"Your strongest areas include {skill_str}. "
    )

    if scores.problem_solving_score > 70:
        persona += "You demonstrate strong algorithmic thinking and competitive programming skills. "
    if scores.development_score > 70:
        persona += "You are an active builder with a solid open-source presence. "
    if scores.social_presence_score < 30:
        persona += "However, your professional visibility online is limited."
    elif scores.social_presence_score > 60:
        persona += "You also maintain a strong professional online presence."

    # Strengths
    strengths: List[str] = []
    if scores.problem_solving_score > 65:
        strengths.append(f"Strong problem-solving ability (score: {scores.problem_solving_score})")
    if scores.development_score > 65:
        strengths.append(f"Active developer with solid project portfolio (score: {scores.development_score})")
    if scores.consistency_score > 65:
        strengths.append(f"Highly consistent coding habits (score: {scores.consistency_score})")
    if scores.hireability_score > 70:
        strengths.append(f"High overall hireability (score: {scores.hireability_score})")
    if skills.get("tech_stack"):
        strengths.append(f"Diverse tech stack: {', '.join(skills['tech_stack'][:4])}")
    if not strengths:
        strengths.append("Actively building skills across multiple platforms")

    # Weaknesses
    weaknesses: List[str] = []
    if scores.visibility_score < 40:
        weaknesses.append("Low professional visibility — limited LinkedIn/Twitter presence")
    if scores.consistency_score < 40:
        weaknesses.append("Inconsistent activity — long gaps between coding sessions")
    if scores.problem_solving_score < 40:
        weaknesses.append("Limited competitive programming exposure")
    if scores.development_score < 40:
        weaknesses.append("Few public projects or open-source contributions")
    if scores.growth_score < 30:
        weaknesses.append("Stagnant growth — ratings/scores not improving over time")
    if not weaknesses:
        weaknesses.append("Minor: Could improve cross-platform consistency")

    # Suggestions
    suggestions: List[str] = [growth.get("recommendation", "Keep practicing consistently")]
    if scores.visibility_score < 50:
        suggestions.append("Start posting technical content on LinkedIn to boost visibility")
    if scores.problem_solving_score < 60:
        suggestions.append("Solve 3-5 LeetCode medium problems per week to improve DSA skills")
    if scores.development_score < 60:
        suggestions.append("Build and publish 2-3 portfolio projects on GitHub")
    if scores.consistency_score < 50:
        suggestions.append("Set a daily coding goal — even 30 minutes maintains momentum")
    suggestions.append("Participate in at least one coding contest per month")

    # Skill gaps
    common_skills = {"python", "javascript", "sql", "system-design", "cloud", "docker", "react", "nodejs"}
    user_skills_lower = {s.lower() for s in scores.all_skills}
    skill_gaps = list(common_skills - user_skills_lower)[:5]

    # Career path
    if scores.development_score > scores.problem_solving_score + 20:
        career_path = "Software Engineer / Full-Stack Developer"
    elif scores.problem_solving_score > scores.development_score + 20:
        career_path = "Competitive Programmer / Algorithm Engineer / SDE at top tech companies"
    elif scores.social_presence_score > 60:
        career_path = "Developer Advocate / Tech Lead"
    else:
        career_path = "Software Engineer (Generalist)"

    return InsightResponse(
        persona=persona.strip(),
        strengths=strengths,
        weaknesses=weaknesses,
        suggestions=suggestions[:5],
        skill_gaps=skill_gaps,
        career_path=career_path,
        generated_by="rule-based",
    )


async def _openai_insights(req: AnalyzeRequest) -> InsightResponse:
    try:
        from openai import AsyncOpenAI
        import json

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        scores = req.scores

        prompt = f"""You are a career coach analyzing a developer's digital footprint.

Scores (0-100):
- Hireability: {scores.hireability_score}
- Problem Solving: {scores.problem_solving_score}
- Development: {scores.development_score}
- Consistency: {scores.consistency_score}
- Visibility: {scores.visibility_score}
- Growth: {scores.growth_score}
- Social Presence: {scores.social_presence_score}

Behavior Type: {scores.behavior_type}
Skills: {', '.join(scores.all_skills[:10])}
Active Platforms: {', '.join(req.platforms)}

Respond ONLY with valid JSON matching this schema:
{{
  "persona": "2-3 sentence description",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "skill_gaps": ["skill1", "skill2"],
  "career_path": "recommended career path"
}}"""

        response = await client.chat.completions.create(
            model=settings.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=600,
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        return InsightResponse(**data, generated_by="openai")

    except Exception as e:
        print(f"OpenAI failed: {e}, falling back to rule-based")
        return _rule_based_insights(req)


async def generate_insights(req: AnalyzeRequest) -> InsightResponse:
    if settings.use_openai and settings.openai_api_key:
        return await _openai_insights(req)
    return _rule_based_insights(req)
