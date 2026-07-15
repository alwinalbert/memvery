'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api/client';

interface LibraryItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number;
  url: string;
  type: string;
  status: string;
  createdAt: string;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export default function LibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'video' | 'channel'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await api.content.getJobs();
      if (response.success) {
        setItems(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading library:', error);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item? This will also remove all associated chat history.')) {
      return;
    }

    setDeleting(id);
    try {
      await api.content.deleteJob(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
    setDeleting(null);
  }

  function handleOpenChat(item: LibraryItem) {
    localStorage.setItem('memvery_current_video', JSON.stringify({
      id: item.id,
      url: item.url,
      title: item.title,
    }));
    router.push('/dashboard');
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channelTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <h1 className="text-xl font-semibold">Library</h1>
          <button
            onClick={() => router.push('/process')}
            className="flex items-center gap-2 px-4 py-2 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Content
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0f0f23] border border-gray-700 rounded-lg focus:outline-none focus:border-[#5227FF] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-[#5227FF] text-white'
                  : 'bg-[#0f0f23] text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'video'
                  ? 'bg-[#5227FF] text-white'
                  : 'bg-[#0f0f23] text-gray-400 hover:text-white'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter('channel')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'channel'
                  ? 'bg-[#5227FF] text-white'
                  : 'bg-[#0f0f23] text-gray-400 hover:text-white'
              }`}
            >
              Channels
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0f0f23] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-[#5227FF]">{items.length}</p>
          </div>
          <div className="bg-[#0f0f23] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Videos</p>
            <p className="text-2xl font-bold text-[#5227FF]">
              {items.filter(i => i.type === 'video').length}
            </p>
          </div>
          <div className="bg-[#0f0f23] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Channels</p>
            <p className="text-2xl font-bold text-[#5227FF]">
              {items.filter(i => i.type === 'channel').length}
            </p>
          </div>
        </div>

        {/* Library Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? 'No matching items' : 'Your library is empty'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Add YouTube videos or channels to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/process')}
                className="px-6 py-3 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg transition-colors"
              >
                Add Your First Video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0f0f23] rounded-lg overflow-hidden group hover:ring-2 hover:ring-[#5227FF] transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  <img
                    src={getYouTubeThumbnail(item.videoId)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs">
                    {formatDuration(item.duration)}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenChat(item)}
                      className="p-3 bg-[#5227FF] rounded-full hover:bg-[#6437FF] transition-colors"
                      title="Open in Chat"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === item.id ? (
                        <svg
                          className="w-6 h-6 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs mb-2">{item.channelTitle}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${
                      item.status === 'completed'
                        ? 'bg-green-900/30 text-green-400'
                        : item.status === 'processing'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-gray-900/30 text-gray-400'
                    }`}>
                      {item.status}
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
