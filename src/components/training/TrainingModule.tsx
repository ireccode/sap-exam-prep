import React from 'react';
import { Book } from 'lucide-react';

interface TrainingModuleProps {
  title: string;
  description: string;
  progress: number;
  onStart: () => void;
}

export function TrainingModule({ title, description, progress, onStart }: TrainingModuleProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Book className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded">
          <div 
            className="h-full bg-blue-600 rounded" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500">{progress}% Complete</span>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Continue Learning
      </button>
    </div>
  );
}