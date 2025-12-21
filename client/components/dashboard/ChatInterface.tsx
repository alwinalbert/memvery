'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '../ui/Input';

/**
 * Message interface
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Mock initial messages for demonstration
 */
const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I can help you search and understand the content from your submitted videos. What would you like to know?',
    timestamp: new Date()
  }
];

/**
 * Chat Interface Component
 * ChatGPT-style interface for interacting with video content
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Send message and get response (placeholder)
    sendChatMessage(input);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a mock response. In production, this would analyze your video content and provide relevant insights.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Chat with Your Content
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="text"
            className="text-black"
            placeholder="Paste YouTube video or channel URL"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
          <Button type="submit" variant="primary">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Placeholder function to simulate sending a chat message
 * In production, this would make an API call
 */
function sendChatMessage(message: string) {
  console.log('Sending chat message:', message);
  // TODO: Implement API call to backend
}
