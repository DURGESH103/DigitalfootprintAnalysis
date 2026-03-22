from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis, resume
from app.core.config import settings

app = FastAPI(title="Digital Footprint AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/analyze", tags=["analysis"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])


@app.get("/health")
def health():
    return {"status": "ok"}
