import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PricingCard } from '../components/PricingCard';

const pricingPlans = [
  {
    title: 'Basic',
    price: 0,
    description: 'Access to basic features',
    features: [
      'Basic question bank access',
      'Practice tests',
      'Progress tracking',
      'Community support',
    ],
    priceId: 'free',
  },
  {
    title: 'Premium',
    price: 19,
    description: 'Full access to all features',
    features: [
      'Complete question bank access',
      'Advanced practice tests',
      'Detailed analytics',
      'Priority support',
      'Custom study plans',
      'Mock exams',
    ],
    priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
  },
];

export const BillingPage: React.FC = () => {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Select the plan that best fits your needs
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.priceId}
              plan={plan}
              isCurrentPlan={
                (plan.priceId === 'free' && !isPremium) ||
                (plan.priceId === import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID && isPremium)
              }
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            All plans include a 30-day money-back guarantee. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}; 