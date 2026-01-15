# Quick Start Guide

## Prerequisites
- Node.js 16+ & npm
- PostgreSQL 12+
- Git

## 5-Minute Setup

### Step 1: Clone and Setup Database
```bash
# Create PostgreSQL database
createdb interview_db

# Or if using Docker:
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=interview_db
JWT_SECRET=dev-secret-key-change-in-production
PORT=3001
FRONTEND_URL=http://localhost:3000
EOF

# Start backend server
npm run dev
```

Backend will be running on `http://localhost:3001`

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Start frontend server
npm run dev
```

Frontend will be running on `http://localhost:3000`

### Step 4: Test the Application
1. Open `http://localhost:3000` in your browser (or visit live demo at [http://evaluate-nine.vercel.app/](http://evaluate-nine.vercel.app/))
2. Click "Sign up" and create an account
3. Create a new interview template
4. Add sections and questions
5. Start an interview and conduct it
6. Review past interviews

## Directory Structure

```
Evaluate/
├── backend/          # NestJS API
├── frontend/         # Next.js Web App
├── README.md         # Full documentation
├── DATABASE_SETUP.md # Database setup guide
└── API_DOCUMENTATION.md # API reference
```

## Environment Setup

### Backend Environment Variables
See `backend/.env.example` for all options

**Required:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (use a long random string in production)
- `PORT`

### Frontend Environment Variables
See `frontend/.env.example`

**Required:**
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Common Commands

### Backend
```bash
cd backend

# Development
npm run dev

# Build
npm run build

# Production
npm run prod

# Lint
npm run lint

# Format code
npm run format
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Start production build
npm run start

# Lint
npm run lint
```

## Database Migration (if needed)

TypeORM is configured to auto-sync the schema. If you need manual control:

```bash
# Generate migration
cd backend
npm run typeorm migration:generate -- -n CreateInitialSchema

# Run migration
npm run typeorm migration:run
```

## Testing the API

### Using Postman
1. Import the collection from `API_DOCUMENTATION.md`
2. Set `{{base_url}}` to `http://localhost:3001`
3. Run requests with Bearer token in Authorization header

### Using cURL
```bash
# Sign up
curl -X POST http://localhost:3001/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!",
    "firstName":"John",
    "lastName":"Doe"
  }'

# Copy the accessToken and use in next requests
TOKEN="your-token-here"

# Get profile
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Create template
curl -X POST http://localhost:3001/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"My Template",
    "description":"My interview template"
  }'
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001 (or 3000)
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env
# Default: postgres user, password: password

# Reset database
dropdb interview_db
createdb interview_db
```

### Frontend Can't Connect to Backend
- Check backend is running on correct port
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend `main.ts`

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .next
```

## Development Tips

### Hot Reload
- Backend: Changes auto-reload with `npm run dev`
- Frontend: Changes auto-reload with `npm run dev`

### Debugging Backend
```bash
# Add debugger and run
npm run debug
# Then use VS Code debugger or Chrome DevTools
```

### Using Postman/Insomnia
1. Set up environment variables for base URL
2. Create collection for API endpoints
3. Use pre-request scripts to handle tokens

### Database Inspection
```bash
# Connect to database
psql interview_db

# List tables
\dt

# View table structure
\d templates

# Query data
SELECT * FROM users;

# Exit
\q
```

## Security Notes (Development Only)

⚠️ **Never use these in production:**
- `DB_PASSWORD=password`
- `JWT_SECRET=dev-secret-key-change-in-production`
- CORS configured for `http://localhost:3000`

### Production Checklist
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Use environment-specific .env files
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for specific domains only
- [ ] Use connection pooling for database
- [ ] Enable rate limiting
- [ ] Setup logging and monitoring
- [ ] Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Setup CI/CD pipeline
- [ ] Run security audit (`npm audit`)

## Performance Tips

### Backend
- Use connection pooling
- Index frequently queried columns
- Cache template data
- Use pagination for lists

### Frontend
- Enable code splitting (automatic with Next.js)
- Use image optimization
- Implement lazy loading
- Cache API responses

## Monitoring

### Logs
```bash
# Backend logs are printed to console
# Check for errors and warnings

# Frontend logs visible in browser DevTools
```

### Database
```bash
# Monitor slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

## Next Steps

1. **Customize Styling** - Modify Tailwind CSS in components
2. **Add More Features** - Extend templates, add analytics
3. **Deploy** - Use Docker, Vercel, AWS, etc.
4. **Scale** - Add caching, optimize queries
5. **Test** - Write unit and E2E tests

## Resources

- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [TypeORM Docs](https://typeorm.io)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Getting Help

- Check API_DOCUMENTATION.md for endpoint details
- Review DATABASE_SETUP.md for database issues
- Check console/terminal for error messages
- Create an issue with error logs and steps to reproduce

## Support

For issues:
1. Check if backend is running
2. Check if database is connected
3. Review error messages in console
4. Check API_DOCUMENTATION.md
5. Create an issue with full error log
