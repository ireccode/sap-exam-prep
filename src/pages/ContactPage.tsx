import React from 'react';
import { ContactForm } from '@/components/contact/ContactForm';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Contact Support
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Have a question or need help? We're here to assist you.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
} 