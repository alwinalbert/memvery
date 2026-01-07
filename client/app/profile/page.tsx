'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalChats: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setProfile({
        id: user.id,
        email: user.email || 'No email',
        createdAt: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        lastSignIn: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Never',
      });

      // Load stats from localStorage
      const savedChats = localStorage.getItem('memvery_chats');
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        setStats({
          totalVideos: chats.length,
          totalChats: chats.length,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <div className="bg-[#0f0f23] rounded-lg p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-[#5227FF] rounded-full flex items-center justify-center text-3xl font-bold">
              {profile?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-1">{profile?.email}</h2>
              <p className="text-gray-400">User ID: {profile?.id.slice(0, 8)}...</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Email Address</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Member Since</p>
              <p className="font-medium">{profile?.createdAt}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Last Sign In</p>
              <p className="font-medium">{profile?.lastSignIn}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Account Status</p>
              <p className="font-medium text-green-400">Active</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#0f0f23] rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-6">Usage Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-[#5227FF] mb-2">
                {stats.totalVideos}
              </p>
              <p className="text-gray-400">Videos Processed</p>
            </div>
            <div className="bg-black/30 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-[#5227FF] mb-2">
                {stats.totalChats}
              </p>
              <p className="text-gray-400">Chat Sessions</p>
            </div>
            <div className="bg-black/30 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-[#5227FF] mb-2">
                {stats.totalVideos * 5}
              </p>
              <p className="text-gray-400">Questions Asked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
