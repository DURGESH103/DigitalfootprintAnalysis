from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeRequest, InsightResponse
from app.services.insight_engine import generate_insights

router = APIRouter()


@router.post("", response_model=InsightResponse)
async def analyze(req: AnalyzeRequest):
    try:
        return await generate_insights(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
