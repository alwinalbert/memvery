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
    // Load current video from localStorage (from process page)
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
        content: `✅ Video processed successfully!\n\n📺 **${video.title}**\n\nYou can now ask me questions about this video and I'll provide answers with timestamp citations!`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages([welcomeMessage]);
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

  const loadChatHistory = () => {
    const savedChats = localStorage.getItem('memvery_chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  };

  const saveChatHistory = (updatedChats: Chat[]) => {
    localStorage.setItem('memvery_chats', JSON.stringify(updatedChats));
    setChats(updatedChats);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const savedMessages = localStorage.getItem(`memvery_chat_${chatId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const handleDeleteChat = (chatId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    // Remove chat from list
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    saveChatHistory(updatedChats);

    // Remove chat messages from localStorage
    localStorage.removeItem(`memvery_chat_${chatId}`);

    // If the deleted chat was selected, clear the current chat
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

    if (!currentChatId) {
      const newChatId = Date.now().toString();
      const newChat: Chat = {
        id: newChatId,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      };
      const updatedChats = [newChat, ...chats];
      saveChatHistory(updatedChats);
      setCurrentChatId(newChatId);
    }

    try {
      // Check if this is a YouTube URL
      const isYouTubeUrl = content.includes('youtube.com') || content.includes('youtu.be');

      if (isYouTubeUrl) {
        // Show processing message
        const processingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🎬 Processing YouTube video...\n\nI'm fetching the transcript using our Python service (yt-dlp). This may take 10-30 seconds depending on the video length.`,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        const messagesWithProcessing = [...updatedMessages, processingMessage];
        setMessages(messagesWithProcessing);

        // Process the video
        const response = await api.content.submit(content);

        if (response.success) {
          setProcessedVideoId(response.data.id);
          setCurrentVideoUrl(content);
          setCurrentVideoTitle(response.data.title);

          const successMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `✅ Video processed successfully!\n\n📺 **${response.data.title}**\n\nYou can now ask me questions about this video and I'll provide answers with timestamp citations!`,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          const finalMessages = [...updatedMessages, successMessage];
          setMessages(finalMessages);
          setIsLoadingMessage(false);

          if (currentChatId) {
            localStorage.setItem(
              `memvery_chat_${currentChatId}`,
              JSON.stringify(finalMessages)
            );
          }
        }
      } else {
        // Regular chat message - use RAG
        if (processedVideoId) {
          const response = await api.chat.sendMessage(content, processedVideoId);

          if (response.success) {
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

            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            setIsLoadingMessage(false);

            if (currentChatId) {
              localStorage.setItem(
                `memvery_chat_${currentChatId}`,
                JSON.stringify(finalMessages)
              );
            }
          }
        } else {
          // No video processed yet
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Please paste a YouTube URL first so I can process the video and answer your questions about it!",
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          setIsLoadingMessage(false);

          if (currentChatId) {
            localStorage.setItem(
              `memvery_chat_${currentChatId}`,
              JSON.stringify(finalMessages)
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Failed to process your request. Please make sure all services are running.'}`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      setIsLoadingMessage(false);

      if (currentChatId) {
        localStorage.setItem(
          `memvery_chat_${currentChatId}`,
          JSON.stringify(finalMessages)
        );
      }
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
