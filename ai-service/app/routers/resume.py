from fastapi import APIRouter, HTTPException
from app.models.schemas import ResumeRequest, ResumeResponse
from app.services.resume_analyzer import analyze_resume_with_ai

router = APIRouter()


@router.post("", response_model=ResumeResponse)
async def resume(req: ResumeRequest):
    try:
        return await analyze_resume_with_ai(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
