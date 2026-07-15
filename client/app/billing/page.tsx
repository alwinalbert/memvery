'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '5 videos per month',
      'Basic chat features',
      '1 project',
      'Community support',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    features: [
      'Unlimited videos',
      'Advanced chat features',
      'Unlimited projects',
      'Priority support',
      'Export conversations',
      'API access',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 49,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared projects',
      'Admin dashboard',
      'SSO integration',
      'Dedicated support',
    ],
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }

  function handleUpgrade(planId: string) {
    // Placeholder for Stripe integration
    alert(`Upgrade to ${planId} plan coming soon! This will integrate with Stripe for payment processing.`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
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
          <h1 className="text-xl font-semibold">Billing</h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Current Plan Info */}
        <div className="bg-[#0f0f23] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
              <p className="text-gray-400">
                You are currently on the <span className="text-[#5227FF] font-medium">Free</span> plan
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-gray-400 text-sm">per month</p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0f0f23] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Videos Used</p>
              <span className="text-xs px-2 py-1 bg-[#5227FF]/20 text-[#5227FF] rounded">This Month</span>
            </div>
            <p className="text-2xl font-bold">2 / 5</p>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#5227FF] rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
          <div className="bg-[#0f0f23] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Projects</p>
              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">Active</span>
            </div>
            <p className="text-2xl font-bold">1 / 1</p>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="bg-[#0f0f23] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Chat Messages</p>
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">Unlimited</span>
            </div>
            <p className="text-2xl font-bold">47</p>
            <p className="mt-2 text-sm text-gray-500">No limit on your plan</p>
          </div>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4 p-1 bg-[#0f0f23] rounded-lg">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingInterval === 'month'
                  ? 'bg-[#5227FF] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingInterval === 'year'
                  ? 'bg-[#5227FF] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-400">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const displayPrice = billingInterval === 'year'
              ? Math.floor(plan.price * 0.8 * 12)
              : plan.price;
            const isCurrent = plan.id === currentPlan;

            return (
              <div
                key={plan.id}
                className={`bg-[#0f0f23] rounded-lg p-6 ${
                  plan.id === 'pro' ? 'ring-2 ring-[#5227FF]' : ''
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-[#5227FF] text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">${displayPrice}</span>
                  <span className="text-gray-400">
                    /{billingInterval === 'year' ? 'year' : 'month'}
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg
                        className="w-5 h-5 text-green-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isCurrent
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : plan.id === 'pro'
                      ? 'bg-[#5227FF] hover:bg-[#6437FF] text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Payment Methods</h3>
          <div className="bg-[#0f0f23] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <svg
                    className="w-8 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400">No payment method added</p>
                  <p className="text-sm text-gray-500">Add a payment method to upgrade your plan</p>
                </div>
              </div>
              <button
                onClick={() => alert('Payment method integration coming soon!')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Billing History</h3>
          <div className="bg-[#0f0f23] rounded-lg p-6">
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No billing history yet</p>
              <p className="text-sm mt-1">Your invoices will appear here once you upgrade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
