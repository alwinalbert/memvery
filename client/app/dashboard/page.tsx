'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import VideoPanel from '@/components/dashboard/VideoPanel';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import { getCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    timestamp: string;
    startTime: number;
    similarity: number;
  }>;
}

interface Chat {
  id: string;
  title: string;
  timestamp: string;
  jobId?: string | null;
}

/**
 * Dashboard Page Component
 * NoteGPT-style interface with video player and summary panel
 * Protected route - requires authentication
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [processedVideoId, setProcessedVideoId] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Load current video from localStorage (from process page or library)
    const currentVideo = localStorage.getItem('memvery_current_video');
    if (currentVideo) {
      const video = JSON.parse(currentVideo);
      setProcessedVideoId(video.id);
      setCurrentVideoUrl(video.url);
      setCurrentVideoTitle(video.title);

      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Video loaded!\n\n**${video.title}**\n\nYou can now ask me questions about this video and I'll provide answers with timestamp citations!`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages([welcomeMessage]);

      // Clear the localStorage after loading
      localStorage.removeItem('memvery_current_video');
    }
  }, []);

  async function checkAuth() {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
      loadChatHistory();
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await api.chat.getConversations();
      if (response.success) {
        setChats(response.data.map(conv => ({
          id: conv.id,
          title: conv.title,
          timestamp: new Date(conv.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          jobId: conv.jobId,
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to localStorage for backwards compatibility
      const savedChats = localStorage.getItem('memvery_chats');
      if (savedChats) {
        setChats(JSON.parse(savedChats));
      }
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setProcessedVideoId(null);
    setCurrentVideoUrl(null);
    setCurrentVideoTitle(null);
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);

    try {
      const response = await api.chat.getMessages(chatId);
      if (response.success) {
        // Set the video context from the conversation
        if (response.data.jobId) {
          setProcessedVideoId(response.data.jobId);
        }

        // Map messages from API response
        setMessages(response.data.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          sources: msg.sources,
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to localStorage
      const savedMessages = localStorage.getItem(`memvery_chat_${chatId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      await api.chat.deleteConversation(chatId);
      setChats(chats.filter((chat) => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Fallback: remove from local state anyway
      setChats(chats.filter((chat) => chat.id !== chatId));
    }

    // Remove from localStorage as fallback cleanup
    localStorage.removeItem(`memvery_chat_${chatId}`);

    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
      setProcessedVideoId(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoadingMessage(true);

    try {
      // Check if this is a YouTube URL
      const isYouTubeUrl = content.includes('youtube.com') || content.includes('youtu.be');

      if (isYouTubeUrl) {
        // Show processing message
        const processingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Processing YouTube video...\n\nFetching the transcript. This may take 10-30 seconds depending on the video length.`,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        setMessages([...updatedMessages, processingMessage]);

        // Process the video
        const response = await api.content.submit(content);

        if (response.success) {
          setProcessedVideoId(response.data.id);
          setCurrentVideoUrl(content);
          setCurrentVideoTitle(response.data.title || 'Video');

          const successMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Video processed successfully!\n\n**${response.data.title}**\n\nYou can now ask me questions about this video and I'll provide answers with timestamp citations!`,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          setMessages([...updatedMessages, successMessage]);
          setIsLoadingMessage(false);
        }
      } else {
        // Regular chat message - use RAG
        if (processedVideoId) {
          const response = await api.chat.sendMessage(content, processedVideoId, currentChatId || undefined);

          if (response.success) {
            // Update current chat ID if a new conversation was created
            if (!currentChatId && response.data.conversationId) {
              setCurrentChatId(response.data.conversationId);
              // Reload chat history to show the new conversation
              loadChatHistory();
            }

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: response.data.response,
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              sources: response.data.sources
            };

            setMessages([...updatedMessages, assistantMessage]);
            setIsLoadingMessage(false);
          }
        } else {
          // No video processed yet
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Please paste a YouTube URL first so I can process the video and answer your questions about it! Or go to your Library to select an existing video.",
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          setMessages([...updatedMessages, assistantMessage]);
          setIsLoadingMessage(false);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process your request. Please make sure all services are running.'}`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setMessages([...updatedMessages, errorMessage]);
      setIsLoadingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a0f]">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <VideoPanel
        videoUrl={currentVideoUrl}
        videoTitle={currentVideoTitle}
      />
      <SummaryPanel
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoadingMessage}
        videoProcessed={!!processedVideoId}
      />
    </div>
  );
}
