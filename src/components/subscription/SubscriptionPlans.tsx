import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Check, X, Loader2, AlertCircle, Smartphone } from 'lucide-react';

export function SubscriptionPlans() {
  const { subscription, isLoading, createCheckoutSession, createCustomerPortalSession, cancelSubscription, reactivateSubscription } = useSubscription();
  const { isPremium } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const PREMIUM_PRICE_ID = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;

  const handleSubscribe = async (priceId: string) => {
    try {
      console.log('Starting checkout process...');
      setError(null);
      setIsProcessing(true);
      const url = await createCheckoutSession(priceId);
      console.log('Received checkout URL:', url);
      if (url) {
        console.log('Redirecting to:', url);
        window.location.href = url;
      } else {
        console.error('No checkout URL received');
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      setError(error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await createCustomerPortalSession();
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600">
          Get access to premium features and support our development
        </p>
      </div>

      {subscription && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Current Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Status: <span className="font-medium capitalize">{subscription.status}</span>
              </p>
              {subscription.cancel_at_period_end && (
                <p className="text-red-600">
                  Your subscription will end on{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="space-x-4">
              {subscription.cancel_at_period_end ? (
                <button
                  onClick={handleReactivateSubscription}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Reactivate
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Free Plan</h3>
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-3xl font-bold mb-6">$0 <span className="text-gray-500 text-base font-normal">/month</span></p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Basic question bank access</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Practice exams</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="flex items-center">
                Mobile access
                <Smartphone className="w-4 h-4 ml-2 text-blue-500" />
              </span>
            </li>
            <li className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-gray-500">Premium question bank</span>
            </li>
            <li className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-gray-500">AI-powered explanations</span>
            </li>
          </ul>
          <button
            disabled={true}
            className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="border rounded-lg p-6 bg-white shadow-sm relative overflow-hidden">
          {/* Premium badge */}
          <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            PREMIUM
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Premium Plan</h3>
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold mb-6">$29 <span className="text-gray-500 text-base font-normal">/month</span></p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Everything in Free plan</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Premium question bank</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>AI-powered explanations</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Priority support</span>
            </li>
          </ul>
          {subscription ? (
            isPremium ? (
              <button
                disabled={true}
                className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(PREMIUM_PRICE_ID)}
                disabled={isProcessing}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Upgrade Now'
                )}
              </button>
            )
          ) : (
            <button
              onClick={() => handleSubscribe(PREMIUM_PRICE_ID)}
              disabled={isProcessing}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Subscribe Now'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 