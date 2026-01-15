# Interview Management System - Full Stack Application

A comprehensive interview management web application built with **Next.js** and **NestJS** for interviewers to create reusable templates, conduct structured interviews, and review performance.

**Live Demo:** [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/)

**Author:** Shikhar Mandloi, Senior Software Engineer

## Project Overview

This application provides:
- **Secure Authentication** (JWT-based)
- **Interview Templates** with customizable sections and questions
- **Live Interview Conduct** with sequential question flow
- **Feedback & Rating System** for each question
- **Past Interview Review** with complete history
- **Syntax-highlighted Code Snippets** for technical interviews

## Tech Stack

### Backend
- **NestJS** (TypeScript, REST API)
- **PostgreSQL** (Database)
- **TypeORM** (ORM)
- **JWT** (Authentication)
- **Bcrypt** (Password Hashing)

### Frontend
- **Next.js 14** (App Router)
- **React 18** (UI)
- **TypeScript**
- **Tailwind CSS** (Styling)
- **Zustand** (State Management)
- **Axios** (HTTP Client)
- **React Syntax Highlighter** (Code Display)

## Project Structure

```
Evaluate/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── entities/      # User entity
│   │   │   ├── dto/           # DTOs (Sign up, Sign in)
│   │   │   ├── guards/        # JWT auth guard
│   │   │   ├── strategies/    # JWT strategy
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── templates/         # Templates module
│   │   │   ├── entities/      # Template, Section, Question entities
│   │   │   ├── dto/           # DTOs for template operations
│   │   │   ├── templates.service.ts
│   │   │   ├── templates.controller.ts
│   │   │   └── templates.module.ts
│   │   │
│   │   ├── interviews/        # Interviews module
│   │   │   ├── entities/      # Interview, InterviewQuestion, Feedback entities
│   │   │   ├── dto/           # DTOs for interview operations
│   │   │   ├── interviews.service.ts
│   │   │   ├── interviews.controller.ts
│   │   │   └── interviews.module.ts
│   │   │
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # App entry point
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # Environment variables
│
└── frontend/                   # Next.js Frontend
    ├── app/
    │   ├── layout.tsx         # Root layout
    │   ├── sign-up/           # Sign up page
    │   ├── sign-in/           # Sign in page
    │   ├── templates/         # Templates listing & management
    │   │   └── [id]/          # Template detail/edit
    │   └── interviews/        # Interview pages
    │       ├── new/           # Start new interview
    │       ├── [id]/
    │       │   ├── conduct/   # Interview flow
    │       │   └── page.tsx   # Interview review
    │       └── page.tsx       # Past interviews list
    │
    ├── lib/
    │   ├── api.ts             # API client & endpoints
    │   ├── store.ts           # Zustand stores
    │   └── hooks.ts           # Custom React hooks
    │
    ├── components/            # Reusable components
    ├── public/                # Static assets
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    └── .env.local             # Environment variables
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  userId UUID NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Sections Table
```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  order INT DEFAULT 0,
  templateId UUID NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL,
  codeSnippet TEXT,
  codeLanguage VARCHAR(50),
  difficulty VARCHAR(50),
  order INT DEFAULT 0,
  sectionId UUID NOT NULL,
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

### User DTO
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Template DTO
```typescript
interface Template {
  id: string;
  name: string;
  description?: string;
  sections: Section[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Section DTO
```typescript
interface Section {
  id: string;
  title: string;
  order: number;
  questions: Question[];
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Question DTO
```typescript
interface Question {
  id: string;
  text: string;
  codeSnippet?: string;
  codeLanguage?: string;
  difficulty?: string;
  order: number;
  sectionId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Interview DTO
```typescript
interface Interview {
  id: string;
  templateId: string;
  userId: string;
  candidateName?: string;
  status: 'draft' | 'in_progress' | 'completed';
  overallNotes?: string;
  questions: InterviewQuestion[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Feedback DTO
```typescript
interface Feedback {
  id: string;
  interviewQuestionId: string;
  notes?: string;
  rating?: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}
```

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

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - Bcrypt with salt rounds
3. **CORS** - Configured for frontend domain
4. **Input Validation** - DTO validation on backend
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
