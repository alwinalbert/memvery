'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase, signOut } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: true,
    autoSave: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('memvery_preferences');
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);

        // Apply dark mode on load
        if (prefs.darkMode) {
          document.documentElement.classList.add('dark');
          document.body.style.background = '#0a0a0a';
          document.body.style.color = '#ededed';
        } else {
          document.documentElement.classList.remove('dark');
          document.body.style.background = '#ffffff';
          document.body.style.color = '#171717';
        }
      } else {
        // Default to dark mode
        document.documentElement.classList.add('dark');
        document.body.style.background = '#0a0a0a';
        document.body.style.color = '#ededed';
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      router.push('/login');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  }

  function handlePreferenceChange(key: keyof typeof preferences) {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('memvery_preferences', JSON.stringify(updated));

    // Apply dark mode to document
    if (key === 'darkMode') {
      if (updated.darkMode) {
        document.documentElement.classList.add('dark');
        document.body.style.background = '#0a0a0a';
        document.body.style.color = '#ededed';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '#ffffff';
        document.body.style.color = '#171717';
      }
    }

    setMessage({ type: 'success', text: `${key === 'darkMode' ? (updated.darkMode ? 'Dark mode enabled' : 'Light mode enabled') : 'Preferences saved!'}` });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      // Clear all localStorage data
      localStorage.clear();

      // Sign out
      await signOut();

      setMessage({
        type: 'success',
        text: 'Account deletion initiated. Please contact support to complete the process.'
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading settings...</p>
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
          <h1 className="text-xl font-semibold">Settings</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-500 text-green-400'
                : 'bg-red-900/20 border border-red-500 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Account Settings */}
        <div className="bg-[#0f0f23] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed at this time</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[#0f0f23] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:border-[#5227FF] focus:outline-none"
                placeholder="Enter new password"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:border-[#5227FF] focus:outline-none"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="px-6 py-3 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="bg-[#0f0f23] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive updates about your account</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('emailNotifications')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.emailNotifications ? 'bg-[#5227FF]' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    preferences.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-400">Use dark theme (recommended)</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('darkMode')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.darkMode ? 'bg-[#5227FF]' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    preferences.darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Auto-Save Chats</p>
                <p className="text-sm text-gray-400">Automatically save chat history</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('autoSave')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.autoSave ? 'bg-[#5227FF]' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    preferences.autoSave ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
          <p className="text-gray-400 mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
