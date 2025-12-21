# Memvery Frontend

A Next.js application for turning videos into searchable knowledge.

## Project Structure

```
client/
├── app/
│   ├── page.tsx              # Landing page (/)
│   ├── signup/
│   │   └── page.tsx          # Sign up page (/signup)
│   ├── login/
│   │   └── page.tsx          # Sign in page (/login)
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard page (/dashboard)
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button component
│   │   └── Input.tsx         # Reusable input component
│   └── dashboard/
│       ├── Header.tsx        # Dashboard header
│       ├── SubmitContent.tsx # URL submission form
│       ├── JobsList.tsx      # Processing queue table
│       └── ChatInterface.tsx # Chat UI
```

## Pages

### 1. Landing Page (/)
- App name and tagline
- Description
- Call-to-action buttons (Get Started, Sign In)

### 2. Sign Up Page (/signup)
- Email and password inputs
- Sign up button
- Link to sign in page
- No authentication logic (UI only)

### 3. Sign In Page (/login)
- Email and password inputs
- Sign in button
- Link to sign up page
- No authentication logic (UI only)

### 4. Dashboard Page (/dashboard)
Three main sections:
- **Submit Content**: Input for YouTube URLs
- **Jobs List**: Table showing processing status
- **Chat Interface**: ChatGPT-style interface for querying video content

## Components

### UI Components
- **Button**: Supports primary, secondary, and outline variants
- **Input**: Text input with optional label and error display

### Dashboard Components
- **Header**: App name and logout button
- **SubmitContent**: Form for submitting YouTube URLs
- **JobsList**: Table displaying mock processing jobs
- **ChatInterface**: Chat UI with message history and input

## Placeholder Functions

The following functions are defined but contain no backend logic:

- `submitRequest(url)` - in SubmitContent.tsx
- `sendChatMessage(message)` - in ChatInterface.tsx
- `handleLogout()` - in Header.tsx

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Notes

- All components are fully typed with TypeScript
- No backend or authentication logic implemented
- Mock data is used for demonstrations
- Forms use client-side state only
- All pages are responsive and mobile-friendly
