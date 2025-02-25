import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Loader2 } from 'lucide-react';

export function SubscriptionStatus() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const { subscription, createCustomerPortalSession, isLoading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      await createCustomerPortalSession();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to open customer portal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = () => {
    navigate('/subscription');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
      
      {isPremium ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span className="text-gray-900">Premium Subscription</span>
          </div>
          
          {subscription && (
            <div className="text-sm text-gray-600">
              <p>Status: {subscription.status}</p>
              <p>Current Period Ends: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
              {subscription.cancel_at_period_end && (
                <p className="text-orange-600">
                  Subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleManageSubscription}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              'Manage Subscription'
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">You are currently on the Basic plan.</p>
          <button
            onClick={handleSubscribe}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
} 