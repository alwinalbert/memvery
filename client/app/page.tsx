import Link from 'next/link';
import Button from '@/components/ui/Button';

/**
 * Landing Page Component
 * Displays app name, tagline, description, and CTA buttons
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <main className="max-w-4xl mx-auto text-center">
        {/* App Name */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Memvery
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-gray-700 mb-6">
          Turn videos into searchable knowledge
        </p>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Paste a YouTube video or channel and chat with its content.
          Transform hours of video into instant, searchable insights.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup">
            <Button variant="primary">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
