#!/bin/bash

# Setup script for Interview Management System

echo "🚀 Starting Interview Management System Setup..."

# Create directories
echo "📁 Creating directory structure..."
mkdir -p backend frontend

# Backend setup
echo "⚙️ Setting up backend..."
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "🗄️ Create PostgreSQL database (you may need to run this manually):"
echo "   createdb interview_db"

echo "📝 Create .env file with:"
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=interview_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF

echo "✅ Backend setup complete!"

# Frontend setup
echo "⚙️ Setting up frontend..."
cd ../frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "📝 Create .env.local file with:"
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup complete! To start development:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend && npm run dev"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
