# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

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
FRONTEND_URL=http://localhost:3001
```

## Setup Instructions

1. **Database**: Create a PostgreSQL database named `dms_db` (or update the name in the config)
2. **Redis**: Ensure Redis is running on localhost:6379
3. **AWS S3**: 
   - Create an S3 bucket
   - Create an IAM user with S3 read/write permissions
   - Add the access key and secret to the `.env` file
4. **JWT Secret**: Generate a strong random string for production use

