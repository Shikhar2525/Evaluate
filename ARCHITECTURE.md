# Architecture & Design Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Interview Manager                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐          ┌──────────────────────┐ │
│  │   Next.js Frontend   │          │  NestJS Backend API  │ │
│  │   (Port 3000)        │◄─────────►│  (Port 3001)         │ │
│  │                      │   REST    │                      │ │
│  │ ┌────────────────┐   │  + JWT    │ ┌────────────────┐  │ │
│  │ │ Pages          │   │           │ │ Modules        │  │ │
│  │ │ - Auth         │   │           │ │ - Auth         │  │ │
│  │ │ - Templates    │   │           │ │ - Templates    │  │ │
│  │ │ - Interviews   │   │           │ │ - Interviews   │  │ │
│  │ └────────────────┘   │           │ └────────────────┘  │ │
│  │                      │           │                      │ │
│  │ ┌────────────────┐   │           │ ┌────────────────┐  │ │
│  │ │ Components     │   │           │ │ Services       │  │ │
│  │ │ - Forms        │   │           │ │ - Business     │  │ │
│  │ │ - Cards        │   │           │ │   Logic        │  │ │
│  │ │ - Editors      │   │           │ └────────────────┘  │ │
│  │ └────────────────┘   │           │                      │ │
│  │                      │           │ ┌────────────────┐  │ │
│  │ ┌────────────────┐   │           │ │ Controllers    │  │ │
│  │ │ State          │   │           │ │ - REST Routes  │  │ │
│  │ │ - Zustand      │   │           │ - Auth Guards  │  │ │
│  │ │ - Auth Store   │   │           │ └────────────────┘  │ │
│  │ │ - Interview    │   │           │                      │ │
│  │ │   Store        │   │           │ ┌────────────────┐  │ │
│  │ └────────────────┘   │           │ │ Entities       │  │ │
│  │                      │           │ │ - User         │  │ │
│  │ ┌────────────────┐   │           │ │ - Template     │  │ │
│  │ │ Hooks          │   │           │ │ - Interview    │  │ │
│  │ │ - useAuth()    │   │           │ │ - Feedback     │  │ │
│  │ │ - useAsyncData │   │           │ └────────────────┘  │ │
│  │ └────────────────┘   │           │                      │ │
│  │                      │           │ ┌────────────────┐  │ │
│  │ ┌────────────────┐   │           │ │ Guards         │  │ │
│  │ │ API Client     │   │           │ │ - JwtAuthGuard │  │ │
│  │ │ - axios        │   │           │ └────────────────┘  │ │
│  │ │ - interceptors │   │           │                      │ │
│  │ └────────────────┘   │           │ ┌────────────────┐  │ │
│  └──────────────────────┘           │ │ Strategies     │  │ │
│                                     │ │ - JwtStrategy  │  │ │
│                                     │ └────────────────┘  │ │
│                                     └──────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │   │
│  │  │  Users   │ │ Templates │ │ Interview       │    │   │
│  │  └──────────┘ └──────────┘ │ Questions       │    │   │
│  │                            │ Feedback        │    │   │
│  │  ┌──────────┐ ┌──────────┐ │ (with relations)│    │   │
│  │  │ Sections │ │Questions │ └──────────────────┘    │   │
│  │  └──────────┘ └──────────┘                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

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
```
auth/
├── entities/
│   └── user.entity.ts           # User data model
├── dto/
│   ├── sign-up.dto.ts           # Registration validation
│   └── sign-in.dto.ts           # Login validation
├── guards/
│   └── jwt-auth.guard.ts        # Route protection
├── strategies/
│   └── jwt.strategy.ts          # JWT verification
├── auth.service.ts              # Business logic
├── auth.controller.ts           # API routes
└── auth.module.ts               # Module definition
```

### Templates Module
```
templates/
├── entities/
│   ├── template.entity.ts       # Template data
│   ├── section.entity.ts        # Section data
│   └── question.entity.ts       # Question data
├── dto/
│   ├── create-template.dto.ts
│   ├── update-template.dto.ts
│   ├── create-section.dto.ts
│   └── create-question.dto.ts
├── templates.service.ts         # Business logic
├── templates.controller.ts      # API routes
└── templates.module.ts          # Module definition
```

### Interviews Module
```
interviews/
├── entities/
│   ├── interview.entity.ts      # Interview data
│   ├── interview-question.entity.ts  # Question tracking
│   └── feedback.entity.ts       # Feedback data
├── dto/
│   ├── create-interview.dto.ts
│   └── update-feedback.dto.ts
├── interviews.service.ts        # Business logic
├── interviews.controller.ts     # API routes
└── interviews.module.ts         # Module definition
```

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
