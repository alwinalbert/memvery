'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/**
 * Submit Content Section Component
 * Allows users to submit YouTube video or channel URLs
 */
export default function SubmitContent() {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder function - no actual backend call
    submitRequest(url);
    setUrl('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Submit Content
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <Input
            type="url"
            className="text-black"
            placeholder="Paste YouTube video or channel URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </form>
    </div>
  );
}

/**
 * Placeholder function to simulate submitting a request
 * In production, this would make an API call
 */
function submitRequest(url: string) {
  console.log('Submitting URL:', url);
  // TODO: Implement API call to backend
}
