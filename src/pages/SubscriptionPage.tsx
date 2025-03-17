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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-16">
          <SubscriptionPlans />
        </div>
      </div>
  );
} 