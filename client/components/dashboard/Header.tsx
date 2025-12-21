'use client';

import Button from '@/components/ui/Button';

/**
 * Dashboard Header Component
 * Displays app name and logout button
 */
export default function Header() {
  const handleLogout = () => {
    // Placeholder function - no actual logout logic
    console.log('Logout clicked');
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
