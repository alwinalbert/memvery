# Memvery

Turn videos into searchable knowledge. Paste a YouTube video or channel and chat with its content.

## Project Structure

```
memvery/
├── client/          # Next.js frontend (React + TypeScript + Tailwind)
├── server/          # Express backend (Node.js + TypeScript)
├── README.md        # This file
└── ...
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials from Project Settings > API

### 3. Set Up Environment Variables

**Frontend (`client/.env.local`):**
```bash
cp client/.env.local.example client/.env.local
```

Edit `client/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (`server/.env`):**
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=http://localhost:3000
```

**Important:** Use the **Service Role Key** (not anon key) for the backend!

### 4. Configure Supabase Auth

Follow the setup guide in `client/SUPABASE_SETUP.md` to:
- Enable email authentication
- Configure redirect URLs
- Enable email confirmations

### 5. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

Backend runs on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:3000`

### 6. Test It Out

1. Open `http://localhost:3000`
2. Click "Get Started" and create an account
3. Check your email and verify your account
4. Sign in and access the dashboard
5. Submit a YouTube URL
6. Chat with the content!

## Features

### Current Features

✅ **User Authentication**
- Sign up with email verification
- Sign in / Sign out
- Protected routes
- Session management

✅ **Modern UI**
- Responsive design
- Clean, minimal interface
- Loading states
- Error handling

✅ **Dashboard**
- Submit YouTube URLs
- View processing queue
- Chat interface

✅ **API Integration**
- RESTful API
- JWT authentication
- Type-safe client
- Error handling

### Planned Features (TODOs)

🚧 **YouTube Integration**
- Extract video transcripts
- Download video metadata
- Support for playlists and channels

🚧 **AI Processing**
- Video content embedding
- Vector database storage
- Semantic search

🚧 **Smart Chat**
- RAG (Retrieval-Augmented Generation)
- Context-aware responses
- Citation of video timestamps

🚧 **Enhanced Features**
- Multiple video comparison
- Export conversations
- Share chat sessions

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Auth:** Supabase Auth
- **State:** React Hooks

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase JWT

### DevOps
- **Package Manager:** npm
- **Development:** tsx (for TypeScript hot reload)
- **Build:** TypeScript Compiler

## Documentation

- [Frontend README](client/README.md)
- [Supabase Setup Guide](client/SUPABASE_SETUP.md)
- [Backend Setup Guide](SERVER_SETUP.md)

## API Endpoints

### Health Check
```
GET /api/health
```

### Content Management
```
POST /api/content/submit    # Submit YouTube URL
GET  /api/content/jobs       # Get user's jobs
```

### Chat
```
POST /api/chat/message              # Send message
GET  /api/chat/history/:contentId   # Get history
```

All endpoints except `/api/health` require authentication.

## Development

### Project Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

**Backend:**
```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm run start    # Start compiled server
```

### Code Structure

**Frontend:**
- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utilities and API clients

**Backend:**
- `src/config/` - Configuration files
- `src/middleware/` - Express middleware
- `src/routes/` - API route handlers

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render)

1. Push to GitHub
2. Connect to Railway/Render
3. Add environment variables
4. Deploy

See deployment guides in respective directories.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues or questions, check the documentation in:
- `client/README.md`
- `client/SUPABASE_SETUP.md`
- `SERVER_SETUP.md`

---

Built with ❤️ using Next.js, Express, and Supabase
