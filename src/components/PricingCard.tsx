import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PricingPlan {
  title: string;
  price: number;
  description: string;
  features: string[];
  priceId: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  isCurrentPlan?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, isCurrentPlan = false }) => {
  const { createCheckoutSession, isLoading, error } = useSubscription();

  const handleSubscribe = async () => {
    const url = await createCheckoutSession(plan.priceId);
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 m-4 max-w-sm w-full">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">{plan.title}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        <p className="mt-4 text-gray-500">{plan.description}</p>
      </div>

      <ul className="mt-6 space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="h-6 w-6 text-green-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="ml-3 text-gray-500">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <button
          onClick={handleSubscribe}
          disabled={isLoading || isCurrentPlan}
          className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : isLoading ? 'Loading...' : 'Subscribe'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}; 