# 📋 Evaluate - Architecture & Design Documentation

**Author:** Shikhar Mandloi, Senior Software Engineer

**Live Demo:** [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/)

## System Architecture Overview - Serverless with Firebase

```
┌─────────────────────────────────────────────────────────────────┐
│                    Evaluate Interview Manager                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Next.js Frontend Application (Vercel)            │  │
│  │  (Port 3000 - Development / Vercel - Production)          │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Pages Layer                                        │  │  │
│  │  │ ├── Authentication (Sign In / Sign Up)           │  │  │
│  │  │ ├── Dashboard                                    │  │  │
│  │  │ ├── Template Management                         │  │  │
│  │  │ └── Interview Management & Conduct              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Components & UI Layer                             │  │  │
│  │  │ ├── Navigation (Navbar)                          │  │  │
│  │  │ ├── Protected Page Wrapper                       │  │  │
│  │  │ ├── Rich Text Editor                            │  │  │
│  │  │ ├── Rich Text Display                           │  │  │
│  │  │ └── Loaders & Status Indicators                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ State Management (Zustand)                        │  │  │
│  │  │ ├── Auth Store (user, token, session)           │  │  │
│  │  │ ├── Interview Store (current interview state)   │  │  │
│  │  │ └── Template Store (cached templates)           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Service Layer                                     │  │  │
│  │  │ ├── Firebase Authentication Service             │  │  │
│  │  │ ├── Firebase Database Service (CRUD)            │  │  │
│  │  │ ├── Firebase Storage Service (Files)            │  │  │
│  │  │ └── API Utilities (HTTP Client)                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ SEO & Performance                                 │  │  │
│  │  │ ├── Metadata Management                         │  │  │
│  │  │ ├── Structured Data (JSON-LD)                  │  │  │
│  │  │ ├── Sitemap & Robots.txt                       │  │  │
│  │  │ └── PWA Manifest                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ (HTTPS REST Calls)                 │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     Firebase Backend-as-a-Service (BaaS)               │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Firebase Authentication                           │ │  │
│  │  │ ├── Email/Password Auth                         │ │  │
│  │  │ ├── Google Sign-In                             │ │  │
│  │  │ ├── JWT Token Management                       │ │  │
│  │  │ └── User Session Management                    │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Firebase Realtime Database                        │ │  │
│  │  │ ├── Users Collection                            │ │  │
│  │  │ ├── Templates Collection                        │ │  │
│  │  │ ├── Interviews Collection                       │ │  │
│  │  │ ├── Feedback Data                              │ │  │
│  │  │ └── Real-time Sync & Listeners                 │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Firebase Storage (File Storage)                    │ │  │
│  │  │ ├── User Avatars                                │ │  │
│  │  │ ├── Interview Recordings (future)              │ │  │
│  │  │ └── Attachments                                │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Firebase Security Rules                           │ │  │
│  │  │ ├── Authentication checks                       │ │  │
│  │  │ ├── User data isolation                         │ │  │
│  │  │ ├── Role-based access control                  │ │  │
│  │  │ └── Data validation rules                      │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     External Integrations                              │  │
│  │ ├── Google Gemini AI (Question suggestions)           │  │
│  │ ├── Vercel Analytics (Performance monitoring)         │  │
│  │ └── Google Search Console (SEO)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Advantages of Serverless Architecture

### User Authentication Flow
```
Frontend                          Backend                    Database
┌──────────────┐               ┌──────────────┐           ┌─────────┐
│ Sign Up Form │─────POST──────►│ AuthController│          │ Users   │
└──────────────┘               │ .signUp()     │           │ Table   │
                                └──────────────┘           └─────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ AuthService  │
                                │ - validate   │
                                │ - hash pwd   │
                                │ - save user  │
                                └──────────────┘
                                       │
                                       ▼
                                  Create User
                                       │
                                       ▼
                                 Generate JWT
                                       │
                                       ▼
                                Return Token
                                       │
                                       ▼
┌──────────────┐               ┌──────────────┐
│ Store Token  │◄─────JSON─────│ API Response │
│ + User Data  │               │ (token+user) │
└──────────────┘               └──────────────┘
```

### Interview Conduction Flow
```
Frontend                         Backend                    Database
┌──────────────┐              ┌──────────────┐           ┌──────────┐
│ Show Question│─────GET──────►│ Interview    │           │ Interview│
│ + Form       │              │ Controller   │           │ Questions│
└──────────────┘              │ .getQuestion │           │ Table    │
                               └──────────────┘           └──────────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │ Interview    │
                               │ Service      │
                               │ - get Q at   │
                               │   index      │
                               └──────────────┘
                                      │
                                      ▼
                               Return Question
                                      │
                                      ▼
┌──────────────┐              ┌──────────────┐
│ User Fills   │              │ Display Data │
│ Feedback     │◄─────JSON────│ (+ relations)│
│ + Rating     │              └──────────────┘
└──────────────┘
        │
        ▼
┌──────────────┐              ┌──────────────┐           ┌──────────┐
│ Submit Form  │─────POST─────►│ Interview    │           │ Feedback │
│              │              │ Controller   │           │ Table    │
└──────────────┘              │ .saveFeedback│           └──────────┘
                               └──────────────┘
                                      │
                                      ▼
                               Save to Database
```

### Template Management Flow
```
Frontend                         Backend                    Database
┌──────────────┐              ┌──────────────┐           ┌──────────┐
│ Create Form  │─────POST─────►│ Template     │           │ Templates│
│ (name, desc) │              │ Controller   │           │ Table    │
└──────────────┘              │ .create()    │           └──────────┘
                               └──────────────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │ Template     │
                               │ Service      │
                               │ - validate   │
                               │ - save       │
                               └──────────────┘
                                      │
                                      ▼
                                  Create Record
                                      │
                                      ▼
              ┌─────────────────────────────────┐
              ▼                                  ▼
        ┌──────────────┐            ┌──────────────┐
        │ Add Sections │            │ Add Questions│
        │ (POST)       │            │ (POST)       │
        └──────────────┘            └──────────────┘
              │                            │
              ▼                            ▼
        Save Section             Save Question
              │                            │
              ▼                            ▼
        ┌──────────────┐            ┌──────────────┐
        │ Sections     │            │ Questions    │
        │ Table        │            │ Table        │
        └──────────────┘            └──────────────┘
```

## Module Structure

### Auth Module
**Note:** The project has migrated from a backend NestJS API to a Firebase-based serverless architecture. DTOs and backend modules are no longer used. All data operations are handled directly through Firebase Realtime Database via the frontend client.

## Database Schema Relations

```
users
  │
  ├──◄─ templates (1:M)
  │       │
  │       ├──◄─ sections (1:M)
  │       │       │
  │       │       └──◄─ questions (1:M)
  │       │               │
  │       │               └──► interview_questions (1:M)
  │       │                       │
  │       │                       └──◄─ feedback (1:1)
  │       │
  │       └──► interviews (FK)
  │
  └──◄─ interviews (1:M)
          │
          └──◄─ interview_questions (1:M)
                  │
                  ├──► questions (FK)
                  └──► feedback (1:1)
```

## Frontend Page Hierarchy

```
App Layout
├── Public Pages
│   ├── /sign-up
│   │   └── SignUpPage
│   │       ├── Form component
│   │       └── useAuth hook
│   │
│   └── /sign-in
│       └── SignInPage
│           ├── Form component
│           └── useAuth hook
│
└── Protected Pages (Require Auth)
    ├── /templates
    │   ├── TemplatesList
    │   ├── TemplateCard (grid)
    │   ├── CreateTemplateForm (modal/collapsible)
    │   └── [id] detail page
    │       ├── SectionEditor
    │       └── QuestionEditor
    │
    ├── /interviews
    │   ├── InterviewsList
    │   ├── InterviewCard (per interview)
    │   ├── /new
    │   │   └── NewInterviewForm
    │   ├── /[id]
    │   │   ├── /conduct
    │   │   │   ├── QuestionDisplay
    │   │   │   ├── CodeSnippet
    │   │   │   ├── FeedbackForm
    │   │   │   └── NavigationControls
    │   │   │
    │   │   └── Review (read-only)
    │   │       ├── Summary stats
    │   │       ├── QuestionReview
    │   │       ├── FeedbackDisplay
    │   │       └── OverallNotes
    │
    └── Common
        ├── Header (navigation)
        ├── Loading states
        └── Error states
```

## State Management Flow

### Auth Store (Zustand)
```
useAuthStore
├── user (User | null)
├── token (string | null)
├── setAuth(user, token)
│   └── Save to localStorage
│       └── Update state
├── clearAuth()
│   └── Remove from localStorage
│       └── Clear state
└── Persistence
    └── Load from localStorage on mount
```

### Interview Store (Zustand)
```
useInterviewStore
├── currentInterviewId (string | null)
├── currentQuestionIndex (number)
├── setCurrentInterview(id)
├── setCurrentQuestion(index)
└── resetInterview()
```

## API Request/Response Pattern

### Standard Request
```typescript
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'  // for protected routes
}

Body: {
  // request data
}
```

### Standard Response (Success)
```typescript
{
  statusCode: 200 | 201,
  data: {
    // response data
  },
  timestamp: ISO_8601_date
}
```

### Standard Response (Error)
```typescript
{
  statusCode: 400 | 401 | 404 | 500,
  message: 'Error description',
  error: 'Error type'
}
```

## Error Handling Flow

### Backend Errors
```
Exception thrown
    │
    ▼
@UseFilters(ExceptionFilter)
    │
    ▼
Format error response
    │
    ▼
Return HTTP status + message
```

### Frontend Errors
```
API call fails
    │
    ▼
Catch in try-catch
    │
    ├──► Network error
    ├──► 401 Unauthorized → redirect to /sign-in
    ├──► 404 Not found
    └──► 500 Server error
    │
    ▼
Show user message
    │
    ▼
Log to console
```

## Security Architecture

### Authentication Layer
```
Request
  │
  ▼
Extract JWT from Authorization header
  │
  ▼
Verify JWT signature
  │
  ├──► Valid → Next middleware
  │     │
  │     ▼
  │   Extract user ID from payload
  │     │
  │     ▼
  │   Attach to request object
  │     │
  │     ▼
  │   Access in controllers
  │
└──► Invalid → 401 Unauthorized
```

### Authorization Layer
```
Controller receives request
  │
  ▼
Extract user ID from request
  │
  ▼
Query database with user ID
  │
  ├──► User owns resource → Allow
  │
└──► User doesn't own resource → 403 Forbidden
```

## Performance Optimization Strategy

### Database Level
- Indexed columns (userId, templateId, interviewId)
- Proper relationships to avoid N+1 queries
- Lazy loading in ORM

### Backend Level
- Service caching (future)
- Connection pooling
- Request validation early
- Efficient queries

### Frontend Level
- Code splitting (automatic with Next.js)
- Lazy component loading
- Client-side state caching
- API result memoization

## Deployment Architecture

### Development
```
Frontend: localhost:3000
Backend: localhost:3001
Database: localhost:5432
```

### Production (Example)
```
Vercel
  │
  ├──► Next.js App
  │
Railway/Render
  │
  ├──► NestJS API
  │
AWS RDS
  │
  └──► PostgreSQL DB
```

## Testing Strategy

### Unit Tests
- Service methods
- Controller logic
- Hook functions
- Component logic

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User sign up → create template → conduct interview
- Complete interview workflow
- Error handling

## Scalability Considerations

### Current Capacity
- ~10,000 users
- ~100,000 interviews
- ~1M interview questions

### Scaling Points
1. Database read replicas
2. Caching layer (Redis)
3. API load balancing
4. CDN for frontend
5. Async job queue (Bull/RabbitMQ)
6. Microservices split

## Monitoring & Logging

### Backend Logs
- Request/response logs
- Error stack traces
- Performance metrics

### Database Logs
- Slow query logs
- Connection pool stats

### Frontend Logs
- Error boundaries
- Console warnings
- Performance metrics

---

**Last Updated:** January 9, 2026
**Architecture Version:** 1.0
