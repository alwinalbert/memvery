'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import SubmitContent from '@/components/dashboard/SubmitContent';
import JobsList from '@/components/dashboard/JobsList';
import ChatInterface from '@/components/dashboard/ChatInterface';
import { getCurrentUser } from '@/lib/auth';

/**
 * Dashboard Page Component
 * Main application interface with three sections
 * Protected route - requires authentication
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <SubmitContent />
          <JobsList />
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
