import React from 'react';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function SubscriptionPage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Choose Your Plan
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Get access to premium features and support our development
          </p>
        </div>
        <div className="mt-16">
          <SubscriptionPlans />
        </div>
      </div>
    </div>
  );
} 