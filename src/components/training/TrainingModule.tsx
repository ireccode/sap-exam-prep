import React from 'react';
import { Book } from 'lucide-react';

interface TrainingModuleProps {
  title: string;
  description: string;
  progress: number;
  onStart: () => void;
}

export function TrainingModule({ title, description, progress = 0, onStart }) {
  const { getModuleProgress } = useProgressStore();
  const moduleProgress = getModuleProgress(title);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <Book className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-gray-100 rounded-full">
          <div 
            className="h-full rounded-full transition-all duration-300 bg-blue-500"
            style={{ width: `${moduleProgress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600">
          {moduleProgress}% Complete
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        {moduleProgress > 0 ? 'Continue Training' : 'Start Training'}
      </button>
    </div>
  );
}