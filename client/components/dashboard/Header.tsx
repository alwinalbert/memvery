'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { signOut } from '@/lib/auth';

/**
 * Dashboard Header Component
 * Displays app name and logout button
 */
export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Memvery
        </h1>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
