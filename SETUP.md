# Quick Setup Guide

## Prerequisites Installation

### PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb dms_db
```

### Redis
```bash
# macOS
brew install redis
brew services start redis
```

## Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (see ENV_SETUP.md)

3. Run migrations:
```bash
npm run migrate
```

4. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

## Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3001`

## Testing the Application

1. Open `http://localhost:3001`
2. Register a new account
3. Login with your credentials
4. Upload a document from the dashboard
5. View, update, or delete documents

## Production Build

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

