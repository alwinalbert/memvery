'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GoogleButton from '@/components/ui/GoogleButton';
import { signUp } from '@/lib/auth';

/**
 * Sign Up Page Component
 * Handles user registration with Supabase auth and email verification
 */
export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signUp(email, password);
      setMessage({
        type: 'success',
        text: 'Check your email to verify your account!'
      });
      form.reset();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Sign up failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0f0f23] border border-[#5227FF] rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400">
              Join Memvery to start learning from videos
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.type === 'error'
                  ? 'bg-red-900/20 text-red-400 border border-red-800'
                  : 'bg-green-900/20 text-green-400 border border-green-800'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <GoogleButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0f0f23] text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="text-center mt-6 text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#5227FF] hover:text-[#6437FF] font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
