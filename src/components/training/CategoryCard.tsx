import React from 'react';
import { Book, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  questionCount: number;
  completedCount: number;
  onClick: () => void;
}

export function CategoryCard({ title, questionCount, completedCount, onClick }: CategoryCardProps) {
  const progress = (completedCount / questionCount) * 100;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Book className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{completedCount} / {questionCount} completed</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-300",
              progress >= 80 ? "bg-green-500" :
              progress >= 50 ? "bg-blue-500" :
              "bg-blue-400"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}