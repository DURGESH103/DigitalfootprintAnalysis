# Digital Footprint Analyzer — Backend

A production-ready backend that analyzes a developer's complete digital presence across coding and social platforms, generating AI-powered insights about skills, behavior, and career growth.

---

## Folder Structure

```
DigitalfootprintAnaysis/
├── backend/                        # Node.js / Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # MySQL pool
│   │   │   ├── redis.js            # Redis client + cache helpers
│   │   │   └── queue.js            # BullMQ queues
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── accountController.js
│   │   │   ├── analysisController.js
│   │   │   ├── reportController.js
│   │   │   └── resumeController.js
│   │   ├── jobs/
│   │   │   └── worker.js           # BullMQ worker (analysis pipeline)
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT middleware
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── ConnectedAccount.js
│   │   │   ├── PlatformData.js
│   │   │   └── Report.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── accounts.js
│   │   │   ├── analysis.js
│   │   │   ├── reports.js
│   │   │   └── resume.js
│   │   ├── services/
│   │   │   ├── fetchers/
│   │   │   │   ├── github.js       # Real GitHub API
│   │   │   │   ├── leetcode.js     # Real LeetCode GraphQL
│   │   │   │   ├── codeforces.js   # Real Codeforces API
│   │   │   │   └── social.js       # CodeChef/HackerRank/LinkedIn/Twitter
│   │   │   ├── normalizer.js       # Unified data normalization
│   │   │   ├── scorer.js           # All scoring computations
│   │   │   ├── analysisEngine.js   # Pattern/skill/growth analysis
│   │   │   ├── aiClient.js         # FastAPI client
│   │   │   └── analytics.js        # Time-based trends
│   │   ├── sockets/
│   │   │   └── index.js            # Socket.io real-time events
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── response.js
│   │   ├── validators/
│   │   │   └── index.js            # Joi schemas
│   │   └── server.js
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/                     # Python / FastAPI AI service
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic models
│   │   ├── routers/
│   │   │   ├── analysis.py
│   │   │   └── resume.py
│   │   └── services/
│   │       ├── insight_engine.py   # Rule-based + OpenAI insights
│   │       └── resume_analyzer.py
│   ├── main.py
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
│
├── database/
│   └── schema.sql                  # Full MySQL schema
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option A — Docker (Recommended)

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env      # fill in values
cp ai-service/.env.example ai-service/.env

# 2. Start everything
docker-compose up --build

# Services:
#   Backend API  → http://localhost:3000
#   AI Service   → http://localhost:8000
#   MySQL        → localhost:3306
#   Redis        → localhost:6379
```

### Option B — Manual

**Backend (Node.js)**
```bash
cd backend
npm install
# Configure backend/.env
npm run dev          # API server on :3000
npm run worker       # BullMQ worker (separate terminal)
```

**AI Service (Python)**
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Database**
```bash
mysql -u root -p < database/schema.sql
```

---

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | Access token secret (change in prod) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `GITHUB_TOKEN` | GitHub personal access token |
| `AI_SERVICE_URL` | FastAPI URL (default: http://localhost:8000) |
| `REDIS_HOST` | Redis host |

### ai-service/.env
| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Optional — enables GPT-powered insights |
| `USE_OPENAI` | `true` to use OpenAI, `false` for rule-based |

---

## API Reference

### Authentication
```
POST /api/auth/signup       { name, email, password }
POST /api/auth/login        { email, password }
POST /api/auth/refresh      { refreshToken }
POST /api/auth/logout       { refreshToken }
GET  /api/auth/me           [protected]
```

### Connected Accounts
```
POST   /api/accounts        { platform, username, access_token? }
GET    /api/accounts
DELETE /api/accounts/:platform
```

Supported platforms: `github`, `gitlab`, `leetcode`, `codeforces`, `codechef`, `hackerrank`, `geeksforgeeks`, `linkedin`, `twitter`

### Analysis
```
POST /api/analysis          { platforms?: [] }   → { jobId }
GET  /api/analysis/job/:id  → { state, result }
```

### Reports
```
GET /api/reports                    → paginated list
GET /api/reports/:reportId          → full report
GET /api/reports/user/:userId       → latest report
GET /api/reports/analytics          → weekly/monthly trends
GET /api/reports/compare            → vs average / top 10%
```

### Resume
```
POST /api/resume/upload     multipart/form-data { resume: file }
```

---

## Sample API Responses

### POST /api/auth/login
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
  }
}
```

### GET /api/reports/:reportId
```json
{
  "success": true,
  "data": {
    "id": 42,
    "user_id": 1,
    "scores": {
      "hireability_score": 74.5,
      "consistency_score": 68.0,
      "visibility_score": 42.0,
      "growth_score": 61.0,
      "problem_solving_score": 82.0,
      "development_score": 71.0,
      "social_presence_score": 28.0,
      "behavior_type": "Problem Solver",
      "all_skills": ["python", "javascript", "algorithms", "dynamic-programming"]
    },
    "insights": {
      "ai": {
        "persona": "You are a strong problem solver with consistent coding habits but low social visibility.",
        "strengths": ["Strong problem-solving ability (score: 82)", "Active developer with solid project portfolio"],
        "weaknesses": ["Low professional visibility — limited LinkedIn/Twitter presence"],
        "suggestions": ["Start posting technical content on LinkedIn", "Build 2-3 portfolio projects on GitHub"],
        "skill_gaps": ["cloud", "docker", "system-design"],
        "career_path": "Competitive Programmer / Algorithm Engineer / SDE at top tech companies",
        "generated_by": "rule-based"
      },
      "analysis": {
        "patterns": { "consistency": "high", "work_frequency": "daily", "platforms_active": 4 },
        "skills": { "tech_stack": ["Python", "JavaScript", "C++"], "dsa_score": 78, "dev_score": 55, "balance": "DSA-heavy" },
        "growth": { "trend": "improving", "growth_velocity": "moderate", "recommendation": "Keep up the momentum" }
      },
      "comparison": {
        "hireability_score": { "your_score": 74.5, "vs_average": 29.5, "vs_top10": -5.5, "percentile": 75 }
      }
    }
  }
}
```

---

## Real-time WebSocket Events

Connect with Socket.io using your JWT:
```js
const socket = io('http://localhost:3000', { auth: { token: 'your_access_token' } });

socket.on('analysis:started',       (d) => console.log(d));
socket.on('analysis:fetching',      (d) => console.log('Fetching:', d.platform));
socket.on('analysis:platform_done', (d) => console.log('Done:', d.platform));
socket.on('analysis:platform_error',(d) => console.log('Error:', d.platform, d.error));
socket.on('analysis:normalizing',   (d) => console.log(d));
socket.on('analysis:ai_processing', (d) => console.log(d));
socket.on('analysis:completed',     (d) => console.log('Report ID:', d.reportId));
socket.on('analysis:failed',        (d) => console.log('Failed:', d.error));
```

---

## Scoring System

| Score | Description | Range |
|---|---|---|
| Hireability Score | Overall employability | 0–100 |
| Problem Solving Score | DSA + competitive programming | 0–100 |
| Development Score | GitHub activity + projects | 0–100 |
| Consistency Score | Regular coding habits | 0–100 |
| Visibility Score | Online professional presence | 0–100 |
| Growth Score | Improving over time | 0–100 |
| Social Presence Score | LinkedIn + Twitter activity | 0–100 |

---

## Platform Support

| Platform | Data Source | Type |
|---|---|---|
| GitHub | Real API | Development |
| LeetCode | Real GraphQL API | Coding |
| Codeforces | Real REST API | Coding |
| CodeChef | Scraping + fallback | Coding |
| HackerRank | Public API + fallback | Coding |
| LinkedIn | Simulated | Social |
| Twitter/X | Simulated | Social |

---

## Architecture

```
Client → Express API → BullMQ Queue → Worker
                ↓                        ↓
            Socket.io              Platform Fetchers
                                         ↓
                                    Normalizer
                                         ↓
                                      Scorer
                                         ↓
                                   FastAPI (AI)
                                         ↓
                                  MySQL (Report)
                                  Redis (Cache)
```
