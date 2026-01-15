# API Documentation

**Author:** Shikhar Mandloi, Senior Software Engineer

**Live Frontend:** [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/)

## Base URL
```
http://localhost:3001
```

## Authentication
All endpoints (except `/auth/sign-up` and `/auth/sign-in`) require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Sign Up
**POST** `/auth/sign-up`

Request:
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:
```json
{
  "message": "User created successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Sign In
**POST** `/auth/sign-in`

Request:
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-09T10:00:00Z"
}
```

---

## Template Endpoints

### Create Template
**POST** `/templates`

Request:
```json
{
  "name": "Senior Frontend Engineer",
  "description": "Interview template for senior frontend positions"
}
```

Response:
```json
{
  "id": "uuid",
  "name": "Senior Frontend Engineer",
  "description": "Interview template for senior frontend positions",
  "userId": "uuid",
  "sections": [],
  "createdAt": "2024-01-09T10:00:00Z",
  "updatedAt": "2024-01-09T10:00:00Z"
}
```

---

### Get All Templates
**GET** `/templates`

Response:
```json
[
  {
    "id": "uuid",
    "name": "Senior Frontend Engineer",
    "description": "...",
    "sections": [...],
    "createdAt": "2024-01-09T10:00:00Z",
    "updatedAt": "2024-01-09T10:00:00Z"
  }
]
```

---

### Get Template by ID
**GET** `/templates/:id`

Response:
```json
{
  "id": "uuid",
  "name": "Senior Frontend Engineer",
  "description": "...",
  "sections": [
    {
      "id": "uuid",
      "title": "JavaScript Fundamentals",
      "order": 0,
      "questions": [...]
    }
  ],
  "createdAt": "2024-01-09T10:00:00Z"
}
```

---

### Update Template
**PUT** `/templates/:id`

Request:
```json
{
  "name": "Updated Template Name",
  "description": "Updated description"
}
```

Response: Updated template object

---

### Delete Template
**DELETE** `/templates/:id`

Response:
```json
{
  "message": "Template deleted successfully"
}
```

---

## Section Endpoints

### Add Section
**POST** `/templates/:templateId/sections`

Request:
```json
{
  "title": "JavaScript Fundamentals",
  "order": 0
}
```

Response:
```json
{
  "id": "uuid",
  "title": "JavaScript Fundamentals",
  "order": 0,
  "templateId": "uuid",
  "questions": [],
  "createdAt": "2024-01-09T10:00:00Z"
}
```

---

### Update Section
**PUT** `/templates/sections/:sectionId`

Request:
```json
{
  "title": "Updated Title",
  "order": 1
}
```

Response: Updated section object

---

### Delete Section
**DELETE** `/templates/sections/:sectionId`

Response:
```json
{
  "message": "Section deleted successfully"
}
```

---

## Question Endpoints

### Add Question
**POST** `/templates/sections/:sectionId/questions`

Request:
```json
{
  "text": "Explain closure in JavaScript",
  "codeSnippet": "function outer() { let x = 10; return function() { return x; } }",
  "codeLanguage": "javascript",
  "difficulty": "medium",
  "order": 0
}
```

Response:
```json
{
  "id": "uuid",
  "text": "Explain closure in JavaScript",
  "codeSnippet": "...",
  "codeLanguage": "javascript",
  "difficulty": "medium",
  "order": 0,
  "sectionId": "uuid",
  "createdAt": "2024-01-09T10:00:00Z"
}
```

---

### Update Question
**PUT** `/templates/questions/:questionId`

Request:
```json
{
  "text": "Updated question text",
  "difficulty": "hard"
}
```

Response: Updated question object

---

### Delete Question
**DELETE** `/templates/questions/:questionId`

Response:
```json
{
  "message": "Question deleted successfully"
}
```

---

## Interview Endpoints

### Create Interview
**POST** `/interviews`

Request:
```json
{
  "templateId": "uuid",
  "candidateName": "John Doe"
}
```

Response:
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "userId": "uuid",
  "candidateName": "John Doe",
  "status": "in_progress",
  "overallNotes": null,
  "questions": [
    {
      "id": "uuid",
      "questionId": "uuid",
      "interviewId": "uuid",
      "order": 0,
      "skipped": false,
      "question": {...},
      "feedback": null
    }
  ],
  "createdAt": "2024-01-09T10:00:00Z"
}
```

---

### Get All Interviews
**GET** `/interviews`

Response:
```json
[
  {
    "id": "uuid",
    "templateId": "uuid",
    "candidateName": "John Doe",
    "status": "completed",
    "createdAt": "2024-01-09T10:00:00Z"
  }
]
```

---

### Get Interview by ID
**GET** `/interviews/:id`

Response: Full interview object with all questions and feedback

---

### Update Interview Status
**PUT** `/interviews/:id/status`

Request:
```json
{
  "status": "completed"
}
```

Response: Updated interview object

---

### Add Overall Notes
**PUT** `/interviews/:id/overall-notes`

Request:
```json
{
  "overallNotes": "Excellent performance, strong fundamentals"
}
```

Response: Updated interview object

---

### Delete Interview
**DELETE** `/interviews/:id`

Response:
```json
{
  "message": "Interview deleted successfully"
}
```

---

## Interview Flow Endpoints

### Get Question at Index
**GET** `/interviews/:interviewId/questions/:index`

Response:
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "question": {...},
  "feedback": null,
  "skipped": false
}
```

---

### Skip Question
**PUT** `/interviews/:interviewId/questions/:questionId/skip`

Response:
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "skipped": true
}
```

---

## Feedback Endpoints

### Save Feedback
**POST** `/interviews/questions/:questionId/feedback`

Request:
```json
{
  "notes": "Good understanding of closures, could improve on edge cases",
  "rating": 4
}
```

Response:
```json
{
  "id": "uuid",
  "interviewQuestionId": "uuid",
  "notes": "Good understanding of closures...",
  "rating": 4,
  "createdAt": "2024-01-09T10:00:00Z",
  "updatedAt": "2024-01-09T10:00:00Z"
}
```

---

### Get Feedback
**GET** `/interviews/questions/:questionId/feedback`

Response: Feedback object or null

---

### Delete Feedback
**DELETE** `/interviews/feedback/:feedbackId`

Response:
```json
{
  "message": "Feedback deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Template not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

Currently not implemented but recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

## CORS

Configured to allow requests from `FRONTEND_URL` environment variable.

## Testing with cURL

```bash
# Sign up
curl -X POST http://localhost:3001/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# Sign in
curl -X POST http://localhost:3001/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create template (with token)
curl -X POST http://localhost:3001/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Template Name","description":"Description"}'

# Get templates
curl http://localhost:3001/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```
