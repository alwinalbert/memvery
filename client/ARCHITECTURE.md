# Frontend Architecture

## Overview

The frontend is a Next.js 16 app using the App Router with a clean, simple architecture. Authentication is handled by Supabase on the client side, while all business logic runs on the backend server.

## Structure

```
client/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page (/)
│   ├── signup/page.tsx      # Sign up page
│   ├── login/page.tsx       # Login page
│   ├── dashboard/page.tsx   # Dashboard (protected)
│   └── auth/callback/       # Auth callback handler
│
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── dashboard/          # Dashboard-specific components
│       ├── Header.tsx
│       ├── SubmitContent.tsx
│       ├── JobsList.tsx
│       └── ChatInterface.tsx
│
├── lib/                    # Utilities and clients
│   ├── auth.ts            # Supabase auth helpers
│   └── api/
│       └── client.ts      # Backend API client
│
└── .env.local             # Environment variables
```

## Key Principles

### 1. Client-Side Only
The frontend is **100% client-side** with no server actions or middleware:
- All pages are Client Components (`'use client'`)
- No server-side rendering for protected routes
- No Next.js middleware

### 2. Supabase for Auth Only
Supabase is used purely for authentication:
- User sign up/sign in
- Email verification
- Session management
- JWT token generation

### 3. Backend for Everything Else
All business logic happens on the backend server:
- Content submission
- Job management
- Chat functionality
- Data storage

## Authentication Flow

### Sign Up
1. User submits email/password → `lib/auth.ts::signUp()`
2. Supabase creates account → Sends verification email
3. User clicks email link → Redirected to `/auth/callback`
4. Callback redirects to `/dashboard`

### Sign In
1. User submits email/password → `lib/auth.ts::signIn()`
2. Supabase validates credentials → Returns session + JWT token
3. Token stored in Supabase client
4. User redirected to `/dashboard`

### Protected Routes
1. Dashboard checks for user → `lib/auth.ts::getCurrentUser()`
2. If no user → Redirect to `/login`
3. If user exists → Show dashboard

### API Requests
1. Component calls API → `lib/api/client.ts`
2. Client gets token → `lib/auth.ts::getAuthToken()`
3. Request sent with `Authorization: Bearer <token>` header
4. Backend validates token → Returns data

## File Purposes

### `lib/auth.ts`
Simple wrapper around Supabase client for:
- Sign up
- Sign in
- Sign out
- Get current user
- Get auth token

### `lib/api/client.ts`
Type-safe HTTP client for backend API:
- Automatically adds auth headers
- Handles errors
- Provides typed methods for all endpoints

### Components
- **UI Components** - Reusable, styled components
- **Dashboard Components** - Connected to backend API
- All components are client-side

## Environment Variables

```env
# Supabase (for auth only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Auth redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## What's NOT in the Frontend

❌ No server actions (`'use server'`)
❌ No middleware
❌ No API routes (except auth callback)
❌ No database queries
❌ No business logic
❌ No Supabase service role key

## What IS in the Frontend

✅ Client Components only
✅ Supabase auth (client-side)
✅ HTTP requests to backend
✅ UI/UX logic
✅ Form handling
✅ State management

## Communication with Backend

```
Frontend                    Backend
--------                    -------
Sign up/in with Supabase
  ↓
Get JWT token from Supabase
  ↓
API request with token  →   Verify JWT token
                       →   Check user permissions
                       →   Process request
                       ←   Return data
Display data
```

## Benefits of This Architecture

1. **Clear Separation** - Frontend handles UI, backend handles logic
2. **Simple Frontend** - No complex server-side code
3. **Scalable** - Backend can be deployed independently
4. **Secure** - Business logic hidden from client
5. **Flexible** - Easy to add mobile app or other clients

## Development

```bash
# Start frontend
cd client
npm run dev

# Frontend runs on http://localhost:3000
```

The frontend expects the backend to be running on `http://localhost:5000`.
