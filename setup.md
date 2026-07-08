# Side Hustle Marketplace - Project Setup Guide

This guide contains all commands needed to set up the Side Hustle Marketplace capstone project from scratch, in order.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (or your chosen database)

## Project Structure

```
capstone_project/
├── backend_api/
├── frontend_ui/
├── planning/
└── reflections/
```

## Setup Steps

### 1. Initialize Project Structure

```bash
# Clone the capstone repository
git clone <repository-url>
cd capstone_project
```

### 2. Backend API Setup

```bash
# Create backend directory
mkdir backend_api
cd backend_api

# Initialize npm project
npm init -y

# Install production dependencies
npm install @prisma/client@^6.7.0
npm install bcrypt@^6.0.0
npm install cors@^2.8.6
npm install dotenv@^17.4.2
npm install express@^5.2.1
npm install jsonwebtoken@^9.0.3
npm install morgan@^1.11.0
npm install prisma@^6.7.0

# Install dev dependencies
npm install --save-dev nodemon@^3.1.14

# Initialize Prisma
npx prisma init

# Update package.json scripts (add these manually or use the package.json below)
# "start": "node index.js"
# "dev": "nodemon index.js"
```

### 3. Configure Backend Environment

```bash
# Create .env file in backend-api/
touch .env
```

Add the following to `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/capstone_project"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### 4. Setup Prisma Schema

Edit `prisma/schema.prisma` with your database models, then run:

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# Optional: Seed database
npx prisma db seed
```

### 5. Frontend UI Setup

```bash
# Navigate back to root
cd ..

# Create React app with Vite
npm create vite@latest frontend_ui -- --template react
cd frontend_ui

# Install production dependencies
npm install axios@^1.18.1
npm install react@^19.2.6
npm install react-dom@^19.2.6
npm install react-router-dom@^7.18.0

# Install dev dependencies
npm install --save-dev @eslint/js@^10.0.1
npm install --save-dev @types/react@^19.2.14
npm install --save-dev @types/react-dom@^19.2.3
npm install --save-dev @vitejs/plugin-react@^6.0.1
npm install --save-dev eslint@^10.3.0
npm install --save-dev eslint-plugin-react-hooks@^7.1.1
npm install --save-dev eslint-plugin-react-refresh@^0.5.2
npm install --save-dev globals@^17.6.0
npm install --save-dev vite@^8.0.12
```

### 6. Configure Frontend Environment

```bash
# Create .env file in frontend_ui/
touch .env
```

Add the following to `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Running the Project

### Start Backend (Development)

```bash
cd backend_api
npm run dev
```

Backend will run on `http://localhost:3000`

### Start Frontend (Development)

```bash
cd frontend_ui
npm run dev
```

Frontend will run on `http://localhost:5173`

## Quick Install Commands (For Existing Project)

If cloning an existing project:

```bash
# Clone repository
git clone <repository-url>
cd capstone_project

# Install backend dependencies
cd backend_api
npm install

# Setup Prisma
npx prisma generate
npx prisma migrate dev

# Install frontend dependencies
cd ../frontend_ui
npm install

# Start both servers (use separate terminals)
# Terminal 1 - Backend
cd backend_api && npm run dev

# Terminal 2 - Frontend
cd frontend_ui && npm run dev
```

## Backend package.json

```json
{
  "name": "backend_api",
  "version": "1.0.0",
  "description": "Side Hustle Marketplace Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": [],
  "author": "Power Panel - Zainab, Ariane, Ardelia",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.11.0",
    "prisma": "^6.19.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

## Useful Prisma Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Pull database schema into Prisma schema
npx prisma db pull

# Push schema changes without migrations
npx prisma db push
```

## Git Setup

```bash
# Initialize git repository
git init

# Create .gitignore
echo "node_modules/
.env
.env.local
dist/
build/
.DS_Store
*.log" > .gitignore

# Initial commit
git add .
git commit -m "Initial commit"
```

## Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Connection Issues
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database credentials

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### CORS Errors
- Ensure CORS is configured in backend
- Check VITE_API_URL in frontend `.env`
- Verify backend is running before frontend

## Additional Notes

- Always run `npx prisma generate` after changing schema
- Use `npm run dev` for development (with hot reload)
- Use `npm start` for production
- Keep `.env` files out of version control
- Prisma version: 6.7.0
