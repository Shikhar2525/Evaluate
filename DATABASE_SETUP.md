# Database Setup Instructions

## Prerequisites
- PostgreSQL 12+
- Node.js 16+

## Setup Steps

### 1. Create Database
```bash
createdb interview_db
```

### 2. Create Tables
Run these SQL commands in your PostgreSQL client:

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates Table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections Table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  "order" INT DEFAULT 0,
  templateId UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  codeSnippet TEXT,
  codeLanguage VARCHAR(50),
  difficulty VARCHAR(50),
  "order" INT DEFAULT 0,
  sectionId UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interviews Table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  templateId UUID NOT NULL REFERENCES templates(id),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidateName VARCHAR(255),
  status VARCHAR(50) DEFAULT 'in_progress',
  overallNotes TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Questions Table
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionId UUID NOT NULL REFERENCES questions(id),
  interviewId UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  "order" INT DEFAULT 0,
  skipped BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewQuestionId UUID NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
  notes TEXT,
  rating DECIMAL(3,1),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX idx_templates_userId ON templates(userId);
CREATE INDEX idx_sections_templateId ON sections(templateId);
CREATE INDEX idx_questions_sectionId ON questions(sectionId);
CREATE INDEX idx_interviews_userId ON interviews(userId);
CREATE INDEX idx_interviews_templateId ON interviews(templateId);
CREATE INDEX idx_interview_questions_interviewId ON interview_questions(interviewId);
CREATE INDEX idx_interview_questions_questionId ON interview_questions(questionId);
CREATE INDEX idx_feedback_interviewQuestionId ON feedback(interviewQuestionId);
```

### 3. With TypeORM (Automatic)
If using NestJS TypeORM with `synchronize: true` in app.module.ts, the tables will be created automatically on first run.

## Sample Data

You can insert sample data for testing:

```sql
-- Insert sample user
INSERT INTO users (email, password, firstName, lastName)
VALUES ('test@example.com', '$2a$10$...', 'John', 'Doe');

-- Insert sample template
INSERT INTO templates (name, description, userId)
VALUES ('Senior Frontend Engineer', 'Interview template for senior frontend positions', (SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1));

-- Insert sections
INSERT INTO sections (title, "order", templateId)
VALUES ('JavaScript Fundamentals', 0, (SELECT id FROM templates WHERE name = 'Senior Frontend Engineer' LIMIT 1));

-- Insert questions
INSERT INTO questions (text, difficulty, "order", sectionId)
VALUES (
  'Explain closure in JavaScript',
  'medium',
  0,
  (SELECT id FROM sections WHERE title = 'JavaScript Fundamentals' LIMIT 1)
);
```

## Migration Strategy

For production deployments, use migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migrations
npm run typeorm migration:revert
```

## Backup & Restore

### Backup Database
```bash
pg_dump interview_db > interview_db_backup.sql
```

### Restore Database
```bash
psql interview_db < interview_db_backup.sql
```

## Database Performance Tips

1. **Use indexes** on frequently queried columns
2. **Partition large tables** if they grow beyond 1GB
3. **Archive old interviews** to separate tables
4. **Use connection pooling** in production
5. **Regular maintenance** with VACUUM and ANALYZE

## Troubleshooting

### Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check firewall settings

### Permission Issues
```bash
# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE interview_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### Reset Database
```bash
DROP DATABASE interview_db;
CREATE DATABASE interview_db;
-- Then run setup steps again
```
