'use client';

/**
 * Job status type definition
 */
type JobStatus = 'queued' | 'processing' | 'ready';

/**
 * Job item interface
 */
interface Job {
  id: string;
  url: string;
  type: 'video' | 'channel';
  status: JobStatus;
}

/**
 * Mock data for demonstration
 */
const mockJobs: Job[] = [
  {
    id: '1',
    url: 'https://youtube.com/watch?v=example1',
    type: 'video',
    status: 'ready'
  },
  {
    id: '2',
    url: 'https://youtube.com/@examplechannel',
    type: 'channel',
    status: 'processing'
  },
  {
    id: '3',
    url: 'https://youtube.com/watch?v=example2',
    type: 'video',
    status: 'queued'
  }
];

/**
 * Jobs List Component
 * Displays submitted content processing status
 */
export default function JobsList() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Processing Queue
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">URL</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockJobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 truncate max-w-xs">
                  {job.url}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {job.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={job.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 * Displays color-coded status badges
 */
function StatusBadge({ status }: { status: JobStatus }) {
  const styles = {
    queued: 'bg-gray-100 text-gray-800',
    processing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
