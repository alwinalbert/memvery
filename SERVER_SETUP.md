# Backend Server Setup Guide

Complete guide for setting up and running the Memvery backend server.

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts           # Environment configuration
│   │   └── supabase.ts      # Supabase admin client
│   ├── middleware/
│   │   └── auth.ts          # Authentication middleware
│   ├── routes/
│   │   ├── index.ts         # Route aggregator
│   │   ├── health.ts        # Health check endpoint
│   │   ├── content.ts       # Content management endpoints
│   │   └── chat.ts          # Chat endpoints
│   └── index.ts             # Express app entry point
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration (IMPORTANT: Use SERVICE_ROLE_KEY, not anon key!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

**Important:**
- Get your **Service Role Key** from Supabase Dashboard > Project Settings > API
- The Service Role Key has admin access and should NEVER be exposed to the client
- Only use it in the backend server

### 3. Start the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status
- No authentication required

```bash
curl http://localhost:5000/api/health
```

### Content Management

#### Submit Content
- **POST** `/api/content/submit`
- Submit a YouTube URL for processing
- **Authentication:** Required
- **Body:**
  ```json
  {
    "url": "https://youtube.com/watch?v=...",
    "type": "video" // or "channel"
  }
  ```

#### Get Jobs
- **GET** `/api/content/jobs`
- Get all submitted jobs for the authenticated user
- **Authentication:** Required

### Chat

#### Send Message
- **POST** `/api/chat/message`
- Send a chat message
- **Authentication:** Required
- **Body:**
  ```json
  {
    "message": "Your question here",
    "contentId": "optional-content-id"
  }
  ```

#### Get Chat History
- **GET** `/api/chat/history/:contentId`
- Get chat history for specific content
- **Authentication:** Required

## Authentication

The server uses Supabase JWT tokens for authentication.

### How It Works

1. Client logs in via Supabase and gets an access token
2. Client sends the token in the `Authorization` header
3. Server verifies the token using Supabase Admin client
4. If valid, the user object is attached to the request

### Example Request

```bash
curl http://localhost:5000/api/content/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Testing the Connection

### 1. Test Health Endpoint

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Memvery API is running",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### 2. Test Protected Endpoint

First, sign in on the frontend to get a token, then:

```bash
# Replace YOUR_TOKEN with actual token from browser
curl http://localhost:5000/api/content/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend-Backend Connection

### Client Configuration

Update `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### API Client Usage

The frontend uses the API client at `client/lib/api/client.ts`:

```typescript
import { api } from '@/lib/api/client';

// Submit content
const result = await api.content.submit(url);

// Get jobs
const jobs = await api.content.getJobs();

// Send chat message
const response = await api.chat.sendMessage(message);
```

The API client automatically:
- Adds authentication headers
- Handles errors
- Provides TypeScript types

## Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Now you can:
1. Access frontend at `http://localhost:3000`
2. Frontend makes API calls to `http://localhost:5000`
3. Changes to either codebase will auto-reload

## CORS Configuration

The server is configured to accept requests from the client URL specified in `.env`:

```typescript
cors({
  origin: config.client.url, // http://localhost:3000
  credentials: true,
})
```

If you need to add more origins (e.g., production frontend):

1. Update `CLIENT_URL` in `.env`
2. Or modify `src/index.ts` to accept multiple origins

## Error Handling

The server includes:
- Global error handler
- 404 handler for unknown routes
- Request logging with Morgan
- Security headers with Helmet

## Next Steps (TODOs)

The current implementation has placeholder functions. To make it fully functional:

### 1. Database Setup
- Create Supabase tables for:
  - `jobs` - Store submitted content
  - `chat_messages` - Store chat history
  - `video_content` - Store processed video data

### 2. YouTube Integration
- Add YouTube Data API integration
- Implement video/channel URL validation
- Extract video metadata and transcripts

### 3. Processing Queue
- Set up a job queue (Bull, BullMQ, or similar)
- Implement background workers
- Add progress tracking

### 4. Vector Database
- Set up Pinecone, Weaviate, or Supabase Vector
- Implement text chunking and embedding
- Store video content as vectors

### 5. LLM Integration
- Add OpenAI/Anthropic API
- Implement RAG (Retrieval-Augmented Generation)
- Query vectors and generate responses

## Troubleshooting

### Server won't start

**Check environment variables:**
```bash
# Make sure .env exists and has correct values
cat .env
```

**Check port availability:**
```bash
# On Windows
netstat -ano | findstr :5000

# On Mac/Linux
lsof -i :5000
```

### Supabase connection fails

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is active
- Ensure you're using Service Role Key, not anon key

### CORS errors

- Make sure `CLIENT_URL` in server `.env` matches your frontend URL
- Check frontend is running on the correct port
- Clear browser cache

### Authentication fails

- Verify user is logged in on frontend
- Check token is being sent in Authorization header
- Ensure token hasn't expired

## Production Deployment

### Environment Variables

Set these in your hosting platform:

```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=https://yourdomain.com
```

### Build and Deploy

```bash
npm run build
npm start
```

### Recommended Platforms

- **Railway** - Easy deployment, built-in PostgreSQL
- **Render** - Free tier available
- **Heroku** - Classic choice
- **DigitalOcean App Platform** - Good pricing
- **AWS/GCP/Azure** - Full control

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Keep SERVICE_ROLE_KEY secret
- [ ] Enable rate limiting
- [ ] Add request validation
- [ ] Set up monitoring
- [ ] Configure proper CORS origins
- [ ] Use environment-specific configs

## Support

For issues or questions:
1. Check this guide
2. Review Supabase docs: https://supabase.com/docs
3. Check Express docs: https://expressjs.com/
