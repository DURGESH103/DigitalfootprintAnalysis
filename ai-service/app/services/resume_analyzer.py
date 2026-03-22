import re
from app.models.schemas import ResumeRequest, ResumeResponse
from app.core.config import settings

TECH_KEYWORDS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "kotlin",
    "react", "vue", "angular", "nodejs", "express", "fastapi", "django", "flask", "spring",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd",
    "machine learning", "deep learning", "tensorflow", "pytorch", "nlp",
    "system design", "microservices", "rest api", "graphql", "grpc",
    "git", "linux", "algorithms", "data structures",
}


def extract_skills_from_resume(text: str) -> set:
    text_lower = text.lower()
    found = set()
    for skill in TECH_KEYWORDS:
        if skill in text_lower:
            found.add(skill)
    return found


def analyze_resume_rule_based(req: ResumeRequest) -> ResumeResponse:
    resume_skills = extract_skills_from_resume(req.resume_text)
    user_skills_lower = {s.lower() for s in req.user_skills}

    matched = list(resume_skills & user_skills_lower)
    missing_from_resume = list(user_skills_lower - resume_skills)[:5]

    # Score: base 50 + skill match bonus
    match_ratio = len(matched) / max(len(user_skills_lower), 1)
    resume_score = min(100, 50 + match_ratio * 50)

    suggestions = []
    if len(matched) < 3:
        suggestions.append("Add more technical skills that match your actual coding activity")
    if "system design" not in resume_skills:
        suggestions.append("Include system design experience if applicable")
    if len(req.resume_text) < 500:
        suggestions.append("Resume seems short — add more project details and achievements")
    if not any(word in req.resume_text.lower() for word in ["built", "developed", "implemented", "designed"]):
        suggestions.append("Use action verbs (built, developed, implemented) to describe your work")
    suggestions.append("Quantify achievements with metrics (e.g., 'reduced load time by 40%')")

    gap_analysis = (
        f"Your resume reflects {len(matched)} of your {len(user_skills_lower)} actual skills. "
        f"Skills present in your activity but missing from resume: {', '.join(missing_from_resume) or 'none'}."
    )

    return ResumeResponse(
        matched_skills=matched,
        missing_skills=missing_from_resume,
        resume_score=round(resume_score, 1),
        suggestions=suggestions[:5],
        skill_gap_analysis=gap_analysis,
        generated_by="rule-based",
    )


async def analyze_resume_with_ai(req: ResumeRequest) -> ResumeResponse:
    if settings.use_openai and settings.openai_api_key:
        try:
            from openai import AsyncOpenAI
            import json

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            prompt = f"""Analyze this resume against the developer's actual skills.

Resume (first 2000 chars):
{req.resume_text[:2000]}

Developer's actual skills from coding platforms: {', '.join(req.user_skills)}

Respond ONLY with valid JSON:
{{
  "matched_skills": ["skill1"],
  "missing_skills": ["skill2"],
  "resume_score": 75.0,
  "suggestions": ["suggestion1", "suggestion2"],
  "skill_gap_analysis": "brief analysis"
}}"""

            response = await client.chat.completions.create(
                model=settings.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=400,
            )
            data = json.loads(response.choices[0].message.content)
            return ResumeResponse(**data, generated_by="openai")
        except Exception as e:
            print(f"OpenAI resume analysis failed: {e}")

    return analyze_resume_rule_based(req)
