# Document Management System (DMS)

A production-ready Document Management System built with Express.js, TypeScript, Sequelize, Redis, Socket.io, AWS S3, and Next.js.

## 🚀 Features

- **Authentication**: JWT-based authentication with Redis session management
- **Document Management**: Upload, view, update, and delete documents
- **AWS S3 Integration**: Secure file storage in the cloud
- **Redis Caching**: Fast document retrieval with intelligent caching
- **Real-time Updates**: Socket.io for real-time document notifications
- **Modern Frontend**: Next.js 14 with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL or MySQL
- Redis
- AWS S3 Account
- npm or yarn

## 🛠️ Installation

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3001`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Documents

- `POST /api/documents/upload` - Upload a document
  - Content-Type: `multipart/form-data`
  - Fields: `file`, `name`, `description` (optional), `category` (optional)
  - Max file size: 10MB
  - Allowed types: pdf, doc, docx, txt, png, jpg, jpeg

- `GET /api/documents` - Get all documents
  - Query params: `page`, `limit`, `category`, `search`
  - Requires authentication

- `GET /api/documents/:id` - Get document by ID
  - Requires authentication

- `PUT /api/documents/:id` - Update document metadata
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "category": "Updated Category"
  }
  ```

- `DELETE /api/documents/:id` - Delete document
  - Requires authentication

## 🔌 Socket.io Events

### Client → Server
- Connect with JWT token in `auth.token`

### Server → Client
- `document:uploaded` - Emitted when a document is uploaded
- `document:updated` - Emitted when a document is updated
- `document:deleted` - Emitted when a document is deleted
- `notification:new` - Emitted when a new notification is created
- `user:online` - Emitted when a user comes online
- `user:offline` - Emitted when a user goes offline

## 🗄️ Database Schema

### Users
- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `role`
- `name`
- `user_type`
- `created_at`
- `updated_at`

### Documents
- `id` (UUID, PK)
- `user_id` (FK to users)
- `name`
- `description`
- `category`
- `s3_key`
- `s3_url`
- `file_size`
- `file_type`
- `created_at`
- `updated_at`

### Categories
- `id` (UUID, PK)
- `name` (unique)
- `color`
- `created_at`
- `updated_at`

### Notifications
- `id` (UUID, PK)
- `user_id` (FK to users)
- `type`
- `title`
- `message`
- `read`
- `created_at`
- `updated_at`

## 🔐 Redis Strategy

### Caching
- **Document List**: `documents:{userId}:{page}:{limit}:{category}:{search}` (TTL: 5 minutes)
- **Individual Document**: `document:{documentId}` (TTL: 10 minutes)
- **Categories**: `categories` (TTL: 1 hour)

### Sessions
- **User Session**: `session:{userId}` (TTL: 7 days)
- **Socket Mapping**: `socket:{socketId}` → `userId`
- **User Sockets**: `user:sockets:{userId}` → Set of socket IDs
- **Online Status**: `user:online:{userId}` (TTL: 7 days)

### Failure Handling
- Redis failures are logged but do not crash the application
- All operations fall back to database queries when Redis is unavailable

## 🏗️ Project Structure

```
DMS/
├── src/
│   ├── config/          # Database, Redis, S3 configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── migrations/      # Database migrations
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.ts        # Application entry point
├── middleware/          # Shared middleware (auth, admin, user)
├── utils/               # Shared utilities (API responses, JWT, catch-async)
├── types/               # TypeScript type definitions
├── frontend/            # Next.js frontend application
└── package.json
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File type and size validation
- Ownership verification for document operations
- CORS configuration
- Environment-based configuration

## 📝 Code Quality

- TypeScript for type safety
- Centralized error handling with `catchAsync`
- Consistent API responses with `useSuccessResponse` and `useErrorResponse`
- Service layer for business logic
- Thin controllers
- No code duplication

## 🚦 Running in Production

1. Set `NODE_ENV=production` in `.env`
2. Build the backend:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

4. Build the frontend:
```bash
cd frontend
npm run build
npm start
```

## 📄 License

ISC

## 🤝 Contributing

This is a production-ready template. Feel free to extend and customize as needed.

