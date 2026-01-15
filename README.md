# 📋 Evaluate - Interview Management System

![Evaluate Logo](./frontend/public/logo.png)

> **A modern interview management platform for interviewers to create reusable templates, conduct structured interviews, and review candidate performance.**

A comprehensive, serverless interview management web application built with **Next.js** and **Firebase** for seamless real-time collaboration and scalability.

🔗 **Live Demo:** [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/)

👤 **Author:** Shikhar Mandloi, Senior Software Engineer

## Project Overview

This application provides:
- **Secure Authentication** (JWT-based)
- **Interview Templates** with customizable sections and questions
- **Live Interview Conduct** with sequential question flow
- **Feedback & Rating System** for each question
- **Past Interview Review** with complete history
- **Syntax-highlighted Code Snippets** for technical interviews

## Tech Stack

### Frontend
- **Next.js 14** (App Router, React 18)
- **TypeScript** (Type-safe development)
- **Tailwind CSS** (Modern styling)
- **Firebase Authentication** (Secure user auth)
- **Firebase Realtime Database** (Real-time data sync)
- **Firebase Storage** (File uploads)
- **Zustand** (State management)
- **React Syntax Highlighter** (Code snippet display)

### Infrastructure
- **Vercel** (Frontend hosting & deployment)
- **Firebase** (Backend-as-a-Service)
  - Authentication
  - Realtime Database
  - Storage
  - Security Rules
- **Serverless Architecture** (No backend maintenance)

## Project Structure

```
Evaluate/
├── frontend/                      # Next.js Frontend Application
│   ├── app/
│   │   ├── layout.tsx            # Root layout with SEO metadata
│   │   ├── page.tsx              # Home page
│   │   ├── sign-up/              # User registration
│   │   │   └── layout.tsx        # Sign up page layout
│   │   ├── sign-in/              # User login
│   │   │   └── layout.tsx        # Sign in page layout
│   │   ├── dashboard/            # User dashboard
│   │   │   └── layout.tsx        # Dashboard layout
│   │   ├── templates/            # Interview template management
│   │   │   ├── layout.tsx        # Templates list layout
│   │   │   └── [id]/             # Template detail/edit
│   │   │       └── page.tsx      # Template editor
│   │   └── interviews/           # Interview management
│   │       ├── layout.tsx        # Interviews layout
│   │       ├── page.tsx          # Past interviews list
│   │       ├── new/              # Start new interview
│   │       │   └── page.tsx      # Interview creation
│   │       └── [id]/
│   │           ├── page.tsx      # Interview review
│   │           └── conduct/      # Interview conduct flow
│   │               └── page.tsx  # Question-by-question flow
│   │
│   ├── lib/
│   │   ├── firebase.ts           # Firebase configuration
│   │   ├── firebase-service.ts   # Firebase CRUD operations
│   │   ├── store.ts              # Zustand state management
│   │   ├── hooks.ts              # Custom React hooks
│   │   ├── api.ts                # API utilities (Firebase)
│   │   ├── gemini.ts             # Gemini AI integration
│   │   ├── seo-metadata.ts       # SEO metadata utilities
│   │   ├── seo-utils.ts          # SEO helper functions
│   │   ├── structured-data.tsx   # Schema markup components
│   │   └── components/
│   │       ├── navbar.tsx        # Navigation bar
│   │       ├── loader.tsx        # Loading indicator
│   │       ├── rich-text-editor.tsx     # Text editor
│   │       ├── rich-text-display.tsx    # Text display
│   │       └── protected-page-wrapper.tsx # Auth wrapper
│   │
│   ├── public/
│   │   ├── robots.txt            # SEO crawler configuration
│   │   ├── manifest.json         # PWA manifest
│   │   └── [icons]               # App icons & logos
│   │
│   ├── globals.css               # Global styles
│   ├── package.json              # Dependencies
│   ├── tailwind.config.ts        # Tailwind configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.js            # Next.js configuration
│   └── .env.local                # Environment variables
│
├── firebase.json                 # Firebase configuration
├── firebase-rules.json           # Firestore security rules
├── [Documentation Files]         # MD documentation
└── .git/                          # Git repository
```

## Firebase Database Structure

The application uses Firebase Realtime Database with the following structure:

```json
{
  "users/{userId}": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "photoURL": "https://...",
    "createdAt": 1641234567890,
    "updatedAt": 1641234567890
  },
  "templates/{userId}/{templateId}": {
    "name": "Senior Frontend Engineer",
    "description": "Template for senior frontend interviews",
    "createdAt": 1641234567890,
    "sections": {
      "{sectionId}": {
        "title": "JavaScript Fundamentals",
        "order": 0,
        "questions": {
          "{questionId}": {
            "text": "What is event delegation?",
            "codeSnippet": "// code here",
            "codeLanguage": "javascript",
            "difficulty": "intermediate",
            "order": 0
          }
        }
      }
    }
  },
  "interviews/{userId}/{interviewId}": {
    "templateId": "{templateId}",
    "candidateName": "John Smith",
    "status": "completed",
    "overallNotes": "...",
    "createdAt": 1641234567890,
    "questions": {
      "{questionId}": {
        "feedback": {
          "notes": "Great answer",
          "rating": 4.5
        },
        "skipped": false
      }
    }
  }
}
```
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE CASCADE
);
```

### Interviews Table
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY,
  templateId UUID NOT NULL,
  userId UUID NOT NULL,
  candidateName VARCHAR(255),
  status VARCHAR(50) DEFAULT 'in_progress',
  overallNotes TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (templateId) REFERENCES templates(id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### InterviewQuestions Table
```sql
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY,
  questionId UUID NOT NULL,
  interviewId UUID NOT NULL,
  order INT DEFAULT 0,
  skipped BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionId) REFERENCES questions(id),
  FOREIGN KEY (interviewId) REFERENCES interviews(id) ON DELETE CASCADE
);
```

### Feedback Table
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  interviewQuestionId UUID NOT NULL,
  notes TEXT,
  rating DECIMAL(3,1),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interviewQuestionId) REFERENCES interview_questions(id) ON DELETE CASCADE
);
```

## API Endpoints

### Authentication
- `POST /auth/sign-up` - Register new user
- `POST /auth/sign-in` - Login user
- `GET /auth/me` - Get current user profile (requires JWT)

### Templates
- `POST /templates` - Create new template (requires JWT)
- `GET /templates` - List all templates for user (requires JWT)
- `GET /templates/:id` - Get template details (requires JWT)
- `PUT /templates/:id` - Update template (requires JWT)
- `DELETE /templates/:id` - Delete template (requires JWT)

### Sections
- `POST /templates/:templateId/sections` - Add section (requires JWT)
- `PUT /templates/sections/:sectionId` - Update section (requires JWT)
- `DELETE /templates/sections/:sectionId` - Delete section (requires JWT)

### Questions
- `POST /templates/sections/:sectionId/questions` - Add question (requires JWT)
- `PUT /templates/questions/:questionId` - Update question (requires JWT)
- `DELETE /templates/questions/:questionId` - Delete question (requires JWT)

### Interviews
- `POST /interviews` - Create new interview (requires JWT)
- `GET /interviews` - List all interviews (requires JWT)
- `GET /interviews/:id` - Get interview details (requires JWT)
- `PUT /interviews/:id/status` - Update interview status (requires JWT)
- `PUT /interviews/:id/overall-notes` - Add overall notes (requires JWT)
- `DELETE /interviews/:id` - Delete interview (requires JWT)

### Interview Flow
- `GET /interviews/:interviewId/questions/:index` - Get question at index (requires JWT)
- `PUT /interviews/:interviewId/questions/:questionId/skip` - Skip question (requires JWT)

### Feedback
- `POST /interviews/questions/:questionId/feedback` - Save feedback (requires JWT)
- `GET /interviews/questions/:questionId/feedback` - Get feedback (requires JWT)
- `DELETE /interviews/feedback/:feedbackId` - Delete feedback (requires JWT)

## Data Models

Data models are now managed through Firebase Realtime Database. See [DATABASE_SETUP.md](DATABASE_SETUP.md) for the current Firebase data structure.

## Frontend Page Structure

### Authentication Pages
- `/sign-up` - User registration
- `/sign-in` - User login

### Template Management
- `/templates` - View and manage templates
- `/templates/[id]` - Edit template (add/edit/delete sections and questions)

### Interview Pages
- `/interviews` - View past interviews
- `/interviews/new?templateId=xxx` - Start new interview
- `/interviews/[id]/conduct` - Interview flow (question by question)
- `/interviews/[id]` - Review completed interview

## Setup & Installation

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password
   DB_NAME=interview_db
   JWT_SECRET=your-secret-key
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb interview_db
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## Key Features

### 1. Authentication & User Management
- Secure JWT-based authentication
- Password hashing with bcrypt
- User profile management
- Data isolation per user

### 2. Template Management
- Create, read, update, delete templates
- Organize templates with sections
- Add questions with optional code snippets
- Difficulty rating for questions
- Syntax highlighting support

### 3. Interview Conduction
- Sequential question flow
- Progress tracking
- Navigation between questions
- Skip questions functionality
- Real-time feedback capture

### 4. Feedback & Evaluation
- Immediate feedback entry per question
- 1-5 star rating system
- Detailed notes for each question
- Overall interview notes

### 5. Interview Review
- View complete interview history
- Review all feedback and ratings
- Filter by status
- Time-based sorting

## Component Hierarchy

### Frontend Components
```
App
├── Layout
│   ├── Header (Navigation)
│   └── Content
├── Auth Pages
│   ├── SignUp
│   └── SignIn
├── Templates
│   ├── TemplatesList
│   ├── TemplateCard
│   ├── CreateTemplateForm
│   ├── TemplateDetail
│   ├── SectionEditor
│   └── QuestionEditor
├── Interviews
│   ├── InterviewsList
│   ├── InterviewCard
│   ├── NewInterviewForm
│   ├── InterviewConduct
│   │   ├── QuestionDisplay
│   │   ├── CodeSnippet
│   │   ├── FeedbackForm
│   │   └── NavigationControls
│   └── InterviewReview
│       ├── QuestionReview
│       └── FeedbackDisplay
└── Loading/Error States
```

## Error Handling

### Backend
- Validation pipe for DTOs
- Exception filters for errors
- HTTP status codes (400, 401, 404, 500)

### Frontend
- Try-catch blocks for API calls
- User-friendly error messages
- Loading states
- Redirect on auth failures

## Security Measures

1. **Firebase Authentication** - Secure token-based auth with Google
2. **Password Hashing** - Firebase handles password security
3. **CORS** - Configured for frontend domain
4. **Firebase Security Rules** - Real-time database access control
5. **User Data Isolation** - Users can only access their own data

## Performance Optimization

1. **Lazy Loading** - Next.js automatic code splitting
2. **Caching** - Client-side state management with Zustand
3. **Pagination** - Ready for large datasets
4. **Indexed Database** - Foreign key constraints optimized

## Future Enhancements

- Real-time collaboration (WebSockets)
- Video/Audio recording during interviews
- Candidate feedback forms
- Analytics & reporting
- Export to PDF
- Interview scheduling
- Email notifications
- Two-factor authentication

## Testing

### Backend Testing
```bash
npm run test
npm run test:e2e
```

### Frontend Testing
```bash
npm run test
npm run test:coverage
```

## Deployment

### Backend Deployment (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "prod"]
```

### Frontend Deployment (Vercel)
```bash
vercel deploy
```

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=interview_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.
