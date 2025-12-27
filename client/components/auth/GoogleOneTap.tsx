'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/auth';

declare const google: any;

// Generate nonce for Google ID token sign-in
const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [nonce, hashedNonce];
};

export default function GoogleOneTap() {
  const router = useRouter();

  const initializeGoogleOneTap = () => {
    (async () => {
      const [nonce, hashedNonce] = await generateNonce();

      // Check if there's already an existing session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/dashboard');
        return;
      }

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: any) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            });

            if (error) throw error;
            router.push('/dashboard');
          } catch (error) {
            console.error('Google One-Tap error:', error);
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      });

      google.accounts.id.prompt();
    })();
  };

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      onReady={initializeGoogleOneTap}
    />
  );
}
