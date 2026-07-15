'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api/client';

interface ProjectItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number;
  url: string;
  status: string;
  addedAt: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProjectItem[];
}

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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await api.projects.get(projectId);
      if (response.success) {
        setProject(response.data);
        setEditName(response.data.name);
        setEditDescription(response.data.description || '');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/projects');
    }
  }

  async function loadLibraryForAdding() {
    setLoadingLibrary(true);
    try {
      const response = await api.content.getJobs();
      if (response.success) {
        // Filter out items already in the project
        const projectItemIds = new Set(project?.items.map(i => i.id) || []);
        setLibraryItems(response.data.filter(item => !projectItemIds.has(item.id)));
      }
    } catch (error) {
      console.error('Error loading library:', error);
    }
    setLoadingLibrary(false);
  }

  async function handleAddItem(jobId: string) {
    setAdding(jobId);
    try {
      await api.projects.addItem(projectId, jobId);
      // Reload project to get updated items
      await loadProject();
      // Update library items list
      setLibraryItems(libraryItems.filter(item => item.id !== jobId));
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item to project');
    }
    setAdding(null);
  }

  async function handleRemoveItem(jobId: string) {
    setRemoving(jobId);
    try {
      await api.projects.removeItem(projectId, jobId);
      setProject(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== jobId)
      } : null);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from project');
    }
    setRemoving(null);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) return;

    setSaving(true);
    try {
      const response = await api.projects.update(
        projectId,
        editName.trim(),
        editDescription.trim() || undefined
      );
      if (response.success) {
        setProject(prev => prev ? {
          ...prev,
          name: response.data.name,
          description: response.data.description,
        } : null);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
    setSaving(false);
  }

  function openAddModal() {
    setShowAddModal(true);
    loadLibraryForAdding();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/projects')}
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
            Back to Projects
          </button>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <button
            onClick={openAddModal}
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
        {/* Project Info Card */}
        <div className="bg-[#0f0f23] rounded-lg p-6 mb-8">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-[#5227FF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-[#5227FF] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(project.name);
                    setEditDescription(project.description || '');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || saving}
                  className="px-4 py-2 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{project.name}</h2>
                {project.description && (
                  <p className="text-gray-400 mb-4">{project.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{project.items.length} {project.items.length === 1 ? 'item' : 'items'}</span>
                  <span>Created {new Date(project.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}</span>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Edit project"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Project Items */}
        {project.items.length === 0 ? (
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
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No content yet</h3>
            <p className="text-gray-500 mb-6">
              Add videos from your library to this project
            </p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg transition-colors"
            >
              Add Content from Library
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.items.map((item) => (
              <div
                key={item.id}
                className="bg-[#0f0f23] rounded-lg overflow-hidden group"
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
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs mb-3">{item.channelTitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Added {new Date(item.addedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removing === item.id}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from project"
                    >
                      {removing === item.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
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
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0f0f23] rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add Content from Library</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingLibrary ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading library...</p>
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    No available content to add. All library items are already in this project
                    or your library is empty.
                  </p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      router.push('/process');
                    }}
                    className="text-[#5227FF] hover:underline"
                  >
                    Add new content to your library
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {libraryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                    >
                      <img
                        src={getYouTubeThumbnail(item.videoId)}
                        alt={item.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                        <p className="text-gray-400 text-xs">{item.channelTitle}</p>
                      </div>
                      <button
                        onClick={() => handleAddItem(item.id)}
                        disabled={adding === item.id}
                        className="px-4 py-2 bg-[#5227FF] hover:bg-[#6437FF] rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {adding === item.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
