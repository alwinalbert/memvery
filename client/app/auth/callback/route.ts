import { NextResponse } from 'next/server';

/**
 * Auth callback route handler
 * Handles email verification redirects from Supabase
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Supabase automatically handles the code exchange on the client side
    // Just redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
