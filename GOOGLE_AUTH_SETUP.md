# Google Authentication Setup Guide

Complete guide to set up Google Sign-In with Supabase using the ID Token method.

## Prerequisites

You need:
- A Google Cloud account
- Your Supabase project

## Step 1: Google Cloud Console Setup

### Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: Memvery
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through the rest

### Configure OAuth Client

6. Application type: **Web application**
7. Name: **Memvery Web Client**
8. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
9. Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback` (Supabase)
   - `https://yourdomain.com/auth/callback` (production)
10. Click **Create**
11. **Copy the Client ID** - you'll need this!

## Step 2: Supabase Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Sign in with Google** to ON
6. Paste your **Google Client ID** (from Step 1)
7. The Client Secret is optional for this method
8. Click **Save**

## Step 3: Frontend Configuration

1. Add your Google Client ID to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

2. Make sure your other environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Step 4: Test It!

1. Start your frontend:
   ```bash
   cd client
   npm run dev
   ```

2. Go to `http://localhost:3000/login` or `/signup`

3. Click the Google button

4. You should see Google's sign-in popup

5. After signing in, you'll be redirected to `/dashboard`

## How It Works

### ID Token Flow

1. User clicks "Continue with Google" button
2. Google's button appears (rendered by Google's SDK)
3. User signs in with Google
4. Google returns an ID token
5. Frontend sends ID token to Supabase using `signInWithIdToken()`
6. Supabase verifies the token and creates a session
7. User is redirected to dashboard

### Security Features

- **Nonce**: Random value prevents replay attacks
- **FedCM**: Chrome's new authentication method (more secure)
- **ID Token**: No OAuth redirect needed, cleaner flow

## Troubleshooting

### Button doesn't appear

- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Check browser console for errors
- Make sure JavaScript origins are configured in Google Console

### "Invalid client" error

- Double-check your Client ID matches exactly
- Verify authorized JavaScript origins include your current URL
- Make sure the OAuth consent screen is configured

### Redirect not working

- Verify redirect URIs in Google Console match exactly
- Check that Supabase callback URL is added
- Ensure no typos in the URLs

### "This app isn't verified" warning

This is normal during development. To remove it:
- Complete OAuth consent screen verification (takes a few days)
- Or click "Advanced" > "Go to [App Name] (unsafe)" during testing

## Production Deployment

When deploying to production:

1. **Update Google Console:**
   - Add production domain to Authorized JavaScript origins
   - Add production callback URLs

2. **Update environment variables:**
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

3. **Verify OAuth consent screen:**
   - Add logo
   - Complete verification process
   - This improves user trust

## Additional Features (Optional)

### One-Tap Sign-In

We've also created a `GoogleOneTap` component that shows a popup automatically. To use it:

```tsx
import GoogleOneTap from '@/components/auth/GoogleOneTap';

// Add to any page
<GoogleOneTap />
```

This will show Google's One-Tap UI automatically when users visit the page.

### Auto Sign-In

Users who previously signed in with Google can be automatically signed in when they return to your site.

## Files Created

- `client/components/ui/GoogleButton.tsx` - Google sign-in button
- `client/components/auth/GoogleOneTap.tsx` - One-Tap component
- `client/lib/auth.ts` - Updated with Google auth
- `client/.env.example` - Environment template

## Support

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Sign-In Docs](https://developers.google.com/identity/gsi/web)
