'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatArea from '@/components/dashboard/ChatArea';
import { getCurrentUser } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  timestamp: string;
}

/**
 * Dashboard Page Component
 * ChatGPT-style interface with sidebar and chat area
 * Protected route - requires authentication
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  useEffect(() => {
    checkAuth();
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

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm ready to help you with your video content! This is a placeholder response. In production, this will connect to your backend API to process and analyze YouTube videos.",
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
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoadingMessage}
      />
    </div>
  );
}
