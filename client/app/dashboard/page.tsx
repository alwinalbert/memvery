import Header from '@/components/dashboard/Header';
import SubmitContent from '@/components/dashboard/SubmitContent';
import JobsList from '@/components/dashboard/JobsList';
import ChatInterface from '@/components/dashboard/ChatInterface';

/**
 * Dashboard Page Component
 * Main application interface with three sections:
 * - Submit Content: Input for YouTube URLs
 * - Jobs List: Shows processing status
 * - Chat Interface: Interactive chat with video content
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Section A: Submit Content */}
          <SubmitContent />

          {/* Section B: Jobs List */}
          <JobsList />

          {/* Section C: Chat Interface */}
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
