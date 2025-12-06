# AWS Mind Quest - Migration Strategy (Supabase → AWS + FastAPI)

## Executive Summary

**Current Stack:**
- Backend: Supabase Edge Functions (Deno)
- Database: PostgreSQL (Supabase managed)
- Frontend: React + Vite + Shadcn/UI
- LLM: Lovable AI (Google Gemini)

**Target Stack:**
- Backend: FastAPI (Python) + AWS Lambda
- Database: AWS RDS PostgreSQL (free tier eligible) OR local PostgreSQL
- Frontend: Angular + Bootstrap/PrimeNG
- LLM: AWS Bedrock OR local Ollama (free alternative)
- Storage: AWS S3 OR local filesystem
- Authentication: AWS Cognito OR local JWT

---

## 🆓 AWS FREE TIER ANALYSIS

### ✅ FREE SERVICES (12 months)
| Service | Free Tier | Notes |
|---------|-----------|-------|
| **AWS Lambda** | 1M requests/month + 400K GB-seconds | Perfect for API endpoints |
| **RDS (PostgreSQL)** | db.t3.micro instance | 20GB storage, enough for dev |
| **S3** | 5GB storage | Good for training resources |
| **Cognito** | 50K monthly active users | Free auth service |
| **CloudWatch** | 10 custom metrics free | Logging included with Lambda |

### ⚠️ PAID/LIMITED SERVICES
| Service | Cost | Alternative |
|---------|------|-------------|
| **Bedrock (LLM)** | $0.00075/1K tokens (Claude) | ❌ Use local Ollama (free) |
| **RDS Data Transfer** | $0.02/GB out | Minimize cross-region transfers |
| **Lambda (after free tier)** | $0.20/1M requests | Still very cheap |

### 📊 COST ESTIMATE (Monthly)
- **Free tier usage**: $0
- **Light production (~100K requests)**: ~$0.02-0.05
- **Moderate production (~1M requests)**: ~$0.20-0.50 + RDS costs

---

## 🗺️ MIGRATION PATH

### Phase 1: Local Development Setup (Week 1)
**Goal:** Replicate current functionality locally before AWS deployment

```
├── Backend: FastAPI (local)
├── Database: PostgreSQL (local via Docker)
├── LLM: Ollama (local, free)
├── Storage: Local filesystem
└── Frontend: Keep React for now, Angular later
```

### Phase 2: AWS Infrastructure Setup (Week 2)
**Goal:** Deploy backend to Lambda, database to RDS

```
├── RDS PostgreSQL (db.t3.micro)
├── AWS Lambda Functions
├── API Gateway (routing)
├── S3 Bucket (resources)
└── Optional: Cognito for auth
```

### Phase 3: Frontend Migration (Week 3-4)
**Goal:** Convert React → Angular

```
├── New Angular project
├── API integration layer
├── Component migration
└── Testing & deployment
```

---

## 📋 ARCHITECTURE COMPARISON

### Current (Supabase)
```
Frontend (React)
    ↓
Supabase API
    ├── Auth: Built-in
    ├── Database: PostgreSQL
    ├── Functions: Deno Edge
    └── LLM: Lovable AI
```

### Proposed (AWS)
```
Frontend (Angular)
    ↓
API Gateway
    ├── /auth → Lambda (Cognito)
    ├── /quizzes → Lambda (FastAPI)
    ├── /questions → Lambda (FastAPI)
    ├── /progress → Lambda (FastAPI)
    └── /resources → S3
         ↓
    RDS (PostgreSQL)
    ↓
    Bedrock (LLM) OR Ollama (local)
```

---

## 🚀 IMPLEMENTATION PLAN

### Step 1: Backend Migration (FastAPI)

#### 1.1 Project Structure
```
aws-mind-quest-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── user.py
│   │   ├── quiz.py
│   │   ├── certification.py
│   │   └── progress.py
│   ├── schemas/
│   │   ├── quiz.py
│   │   └── user.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── quizzes.py
│   │   ├── questions.py
│   │   ├── progress.py
│   │   └── achievements.py
│   ├── services/
│   │   ├── llm_service.py (Ollama/Bedrock)
│   │   ├── quiz_generator.py
│   │   ├── quiz_evaluator.py
│   │   └── auth_service.py
│   ├── database/
│   │   ├── db.py
│   │   ├── models.py (SQLAlchemy)
│   │   └── migrations/ (Alembic)
│   ├── utils/
│   │   ├── auth.py
│   │   ├── validators.py
│   │   └── errors.py
│   └── lambda_handler.py (for AWS deployment)
├── requirements.txt
├── .env
├── docker-compose.yml (local dev)
└── tests/
```

#### 1.2 Key Dependencies
```
FastAPI==0.104.0
uvicorn==0.24.0
SQLAlchemy==2.0.0
alembic==1.13.0
psycopg2-binary==2.9.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.1.0
boto3==1.34.0  # AWS SDK
requests==2.31.0
ollama==0.0.1  # Local LLM (optional)
```

#### 1.3 Database Schema (Same as before)
- Use SQLAlchemy ORM instead of raw SQL
- Alembic for migrations
- Same tables: certifications, profiles, quizzes, questions, user_progress, achievements

---

### Step 2: Database Setup Options

#### Option A: AWS RDS (Free Tier)
```bash
# db.t3.micro instance
- 20GB storage
- Single-AZ deployment
- Multi-AZ disabled (free tier)
- Backup retention: 1 day
- Cost: ~$15/month after free tier, but acceptable
```

#### Option B: Local PostgreSQL (Recommended for Dev)
```bash
# Docker setup
docker run -d \
  --name aws-mind-quest-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aws_mind_quest \
  -p 5432:5432 \
  postgres:16-alpine
```

**Recommendation:** Use **local PostgreSQL during development**, migrate to RDS later only if needed.

---

### Step 3: LLM Options

#### Option A: AWS Bedrock (Paid)
```python
# Costs ~$0.00075 per 1K input tokens
import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=json.dumps({
        "messages": [{"role": "user", "content": "Generate AWS quiz..."}],
        "max_tokens": 1024
    })
)
```

#### Option B: Ollama (FREE - Recommended for Free Tier)
```bash
# Install Ollama from ollama.ai
# Run: ollama serve

# Then use local API
import requests

response = requests.post(
    'http://localhost:11434/api/generate',
    json={
        'model': 'mistral',  # or llama2, neural-chat, etc.
        'prompt': 'Generate AWS quiz questions...',
        'stream': False
    }
)
```

**Recommendation:** Use **Ollama locally** for free tier account. Switch to Bedrock only if you need better quality.

---

### Step 4: FastAPI Implementation Examples

#### Example 1: Quiz Generation Endpoint
```python
# app/routers/quizzes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.quiz import QuizCreate
from app.services.quiz_generator import generate_quiz
from app.database.db import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

@router.post("/generate")
async def generate_new_quiz(
    quiz_data: QuizCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new quiz using LLM"""
    try:
        quiz = await generate_quiz(
            user_id=current_user['sub'],
            certification_id=quiz_data.certification_id,
            difficulty=quiz_data.difficulty,
            weak_domains=quiz_data.weak_domains,
            db=db
        )
        return {"success": True, "quiz": quiz}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{quiz_id}/evaluate")
async def evaluate_quiz(
    quiz_id: str,
    answers: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluate quiz answers"""
    # Implementation similar to current Supabase function
    pass
```

#### Example 2: LLM Service (Local Ollama)
```python
# app/services/llm_service.py
import requests
import json
from typing import Optional

class LLMService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    async def generate_quiz(
        self,
        certification: str,
        difficulty: str,
        domains: list[str]
    ) -> dict:
        """Generate quiz questions using Ollama"""
        prompt = f"""Generate 5 AWS certification quiz questions for {certification} at {difficulty} difficulty level.
        
Focus on: {', '.join(domains)}

Return ONLY valid JSON (no markdown):
{{
  "questions": [
    {{
      "question_text": "?",
      "question_type": "multiple_choice",
      "options": [],
      "correct_answer": "...",
      "explanation": "...",
      "difficulty": "{difficulty}",
      "domain": "..."
    }}
  ]
}}
"""
        
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"LLM error: {response.text}")
        
        content = response.json()['response']
        # Parse JSON from response
        quiz_data = json.loads(content)
        return quiz_data
```

---

### Step 5: AWS Lambda Deployment

#### 5.1 Create Lambda Function
```bash
# Package FastAPI for Lambda
pip install -r requirements.txt -t package/
cd package
zip -r ../function.zip .
cd ..
zip -r function.zip app/

# Deploy
aws lambda create-function \
  --function-name aws-mind-quest-api \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT:role/lambda-exec-role \
  --handler app.lambda_handler.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables={
    DB_HOST=your-rds-endpoint,
    DB_USER=admin,
    DB_PASSWORD=xxxxx,
    DB_NAME=aws_mind_quest,
    LLM_PROVIDER=ollama,
    OLLAMA_URL=http://localhost:11434
  }
```

#### 5.2 Lambda Handler Wrapper
```python
# app/lambda_handler.py
from mangum import Mangum
from app.main import app

# Wrap FastAPI app for Lambda
handler = Mangum(app)
```

#### 5.3 Connect API Gateway
```bash
aws apigatewayv2 create-api \
  --name aws-mind-quest-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:ACCOUNT:function:aws-mind-quest-api
```

---

### Step 6: Frontend Migration to Angular

#### 6.1 Create New Angular Project
```bash
ng new aws-mind-quest-frontend
cd aws-mind-quest-frontend
ng add @angular/material
npm install @ng-bootstrap/ng-bootstrap
npm install axios
```

#### 6.2 Project Structure
```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── api.service.ts (HTTP calls)
│   │   │   ├── auth.service.ts
│   │   │   └── quiz.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── models/
│   │       ├── quiz.ts
│   │       └── user.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   └── auth.module.ts
│   │   ├── quiz/
│   │   │   ├── components/
│   │   │   │   ├── quiz-list/
│   │   │   │   ├── quiz-generator/
│   │   │   │   └── quiz-taker/
│   │   │   └── quiz.module.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── progress/
│   │   │   │   └── achievements/
│   │   │   └── dashboard.module.ts
│   │   └── profile/
│   │       ├── components/
│   │       └── profile.module.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   └── shared.module.ts
│   └── app.module.ts
├── styles/
└── index.html
```

#### 6.3 Example: API Service
```typescript
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'https://your-api-gateway-url/api';

  constructor(private http: HttpClient) {}

  generateQuiz(certId: string, difficulty: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/quizzes/generate`, {
      certification_id: certId,
      difficulty
    });
  }

  evaluateQuiz(quizId: string, answers: Record<string, any>): Observable<any> {
    return this.http.post(`${this.apiUrl}/quizzes/${quizId}/evaluate`, {
      answers
    });
  }

  getProgress(): Observable<any> {
    return this.http.get(`${this.apiUrl}/progress`);
  }
}
```

---

## 📊 COST BREAKDOWN (First Year)

| Item | Free Tier | Year 2+ |
|------|-----------|---------|
| Lambda (1M req/mo) | $0 | ~$0.20 |
| RDS db.t3.micro | $0 | ~$15-30 |
| S3 (5GB) | $0 | ~$0.12 |
| Data transfer (1GB/mo) | $0 | ~$0.02 |
| **Total** | **$0** | **~$15-31/month** |

---

## ⚡ QUICK START CHECKLIST

### Local Development (Week 1)
- [ ] Install Docker, PostgreSQL, Python 3.11
- [ ] Install Ollama (free LLM)
- [ ] Clone & setup FastAPI backend
- [ ] Run database migrations
- [ ] Test API endpoints locally
- [ ] Keep React frontend for now

### AWS Deployment (Week 2)
- [ ] Create AWS RDS PostgreSQL instance (db.t3.micro)
- [ ] Create IAM role for Lambda
- [ ] Package & deploy FastAPI to Lambda
- [ ] Create API Gateway
- [ ] Test endpoints with API Gateway
- [ ] Setup CloudWatch logging

### Frontend Migration (Week 3-4)
- [ ] Setup new Angular project
- [ ] Create core services (API, Auth)
- [ ] Build authentication module
- [ ] Build quiz module
- [ ] Build dashboard module
- [ ] Deploy to CloudFront/S3

---

## 📚 ALTERNATIVE: LIGHTER AWS SETUP

If you want to minimize AWS usage:

**Option: EC2 + RDS Micro**
```bash
# Use t2.micro EC2 instance (free tier)
# Deploy FastAPI directly (no Lambda)
# Still use RDS for database
# Use Ollama on EC2 or local

Benefits:
- Simpler deployment
- Better for debugging
- Same free tier eligibility

Costs (Year 2+):
- EC2 t2.micro: ~$5/month
- RDS: ~$15/month
- Total: ~$20/month
```

---

## 🔄 RECOMMENDATIONS

**For Your Free Tier Account:**

1. ✅ **USE:** Local PostgreSQL (Docker) + Ollama (local LLM)
2. ✅ **USE:** FastAPI on EC2 t2.micro (or Lambda)
3. ⏸️ **SKIP:** Bedrock initially (paid LLM)
4. ✅ **USE:** S3 only for training resources (5GB free)
5. ⏸️ **SKIP:** RDS initially, use local DB first
6. ✅ **USE:** Cognito when ready (50K free users)

**Upgrade to paid only when:**
- Monthly requests exceed 1M
- Need better LLM quality than Ollama
- Need multi-region deployment

---

## 🎯 NEXT STEPS

1. **Do you want to start with FastAPI locally?** (I can scaffold the project)
2. **Prefer Ollama or Bedrock for LLM?** (I'll help setup)
3. **Need AWS Lambda deployment guide?** (I can create step-by-step)
4. **Want Angular frontend setup?** (I can generate boilerplate)

Which would you like to tackle first?
