# Quick Start - Frontend + FastAPI Integration

## TL;DR - Get Running in 5 Minutes

### Prerequisites
- Node.js/Bun installed
- FastAPI backend running on `http://localhost:8000`

### Step 1: Install Dependencies
```bash
cd aws-mind-quest
bun install  # or: npm install
```

### Step 2: Configure Backend URL
Edit `.env.local`:
```env
VITE_API_URL=http://localhost:8000/api
```

### Step 3: Start Frontend
```bash
bun run dev  # or: npm run dev
```

Frontend opens at `http://localhost:5173`

### Step 4: Verify FastAPI is Running
```bash
# In another terminal, check backend
curl http://localhost:8000/docs
```

Should open FastAPI Swagger UI.

## What Works Now

✅ User Authentication (signup/signin/signout)
✅ User Dashboard with stats
✅ Quiz Generation
✅ Quiz Taking
✅ Results Review
✅ User Profile Management
✅ Certification Selection

## What You Need to Implement in FastAPI

Your FastAPI backend needs these endpoints (see `FASTAPI_INTEGRATION.md` for details):

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/profiles/{user_id}
PUT    /api/profiles/{user_id}

GET    /api/certifications
GET    /api/certifications/{id}

GET    /api/progress/{user_id}/{cert_id}
PUT    /api/progress/{user_id}/{cert_id}

POST   /api/quizzes/generate
GET    /api/quizzes/{quiz_id}
GET    /api/quizzes?user_id={user_id}&limit=5
POST   /api/quizzes/{quiz_id}/submit
GET    /api/quizzes/{quiz_id}/questions

GET    /api/questions/{question_id}
```

## Project Structure

```
aws-mind-quest/
├── src/
│   ├── pages/
│   │   ├── Auth.tsx           ✅ Updated
│   │   ├── Dashboard.tsx       ✅ Updated
│   │   ├── Quiz.tsx            ✅ Updated
│   │   ├── Results.tsx         ✅ Updated
│   │   ├── Profile.tsx         ✅ Updated
│   │   └── ...
│   ├── services/
│   │   └── api.ts              ✨ NEW - API Client
│   ├── components/             (unchanged)
│   ├── hooks/                  (unchanged)
│   └── integrations/           (unchanged)
├── .env.local                  ✨ NEW - Local config
├── .env.example                ✨ NEW - Config template
└── FASTAPI_INTEGRATION.md      ✨ NEW - Full guide
```

## Common Issues

### "API is not responding"
- Check FastAPI backend is running: `curl http://localhost:8000/docs`
- Check `.env.local` has correct `VITE_API_URL`
- Check network tab in browser dev tools

### "CORS error"
- Add frontend URL to FastAPI CORS config
- See FASTAPI_INTEGRATION.md for CORS setup

### "401 Unauthorized"
- Token not being sent with request
- Token expired
- Backend not validating tokens correctly

### "User not found"
- Sign up first before signing in
- Backend may not be creating user profile correctly

## API Client Usage

All API calls go through `src/services/api.ts`:

```typescript
import { apiClient } from "@/services/api";

// Sign up
await apiClient.signUp({
  email: "user@example.com",
  password: "password123",
  username: "username",
  selected_certification_id: "cert-id"
});

// Sign in
await apiClient.signIn({
  email: "user@example.com",
  password: "password123"
});

// Get current user
const user = await apiClient.getCurrentUser();

// Generate quiz
const { quiz, questions } = await apiClient.generateQuiz("cert-id");

// Submit quiz
const result = await apiClient.submitQuiz(quiz.id, answers);
```

## Build for Production

```bash
npm run build     # Creates optimized dist/ folder
npm run preview   # Test production build locally
```

Deploy `dist/` folder to any static hosting.

## Need Help?

1. Read `FASTAPI_INTEGRATION.md` for detailed docs
2. Check `src/services/api.ts` for available methods
3. Look at page implementations (e.g., `src/pages/Auth.tsx`)
4. Check browser console for errors
5. Check network tab in browser dev tools

## What's Next?

1. Implement all API endpoints in FastAPI
2. Test end-to-end user flows
3. Add error handling and validation
4. Set up user feedback mechanisms
5. Deploy!

---

**Frontend is ready!** 🚀 Now focus on FastAPI backend implementation.
