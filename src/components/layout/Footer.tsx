import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-gray-600 font-medium">SAPArchitectPrep</span>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link
              to="/terms"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms & Conditions
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact Support
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">© {new Date().getFullYear()} SAPArchitectPrep</span>
          </div>
        </div>
      </div>
    </footer>
  );
} 