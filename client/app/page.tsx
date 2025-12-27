'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Cubes from '@/components/landing/Cubes';

/**
 * Landing Page Component
 * Displays app name, tagline, description, and CTA buttons with animated 3D cubes
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden relative">
      <div className="absolute inset-0">
        <Cubes
          gridSize={12}
          maxAngle={60}
          radius={4}
          cellGap={8}
          borderStyle="2px dashed #5227FF"
          faceColor="#1a1a2e"
          rippleColor="#ff6b6b"
          rippleSpeed={1.5}
          autoAnimate={true}
          rippleOnClick={true}
        />
      </div>

      <main className="max-w-4xl mx-auto text-center relative z-10">
        {/* App Name */}
        <h1 className="text-6xl font-bold text-[#5227FF] mb-4">
          Memvery
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-gray-400 mb-6">
          Turn videos into searchable knowledge
        </p>

        {/* Description */}
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
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
