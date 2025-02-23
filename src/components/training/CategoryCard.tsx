import React from 'react';
import { Book, ArrowRight, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryCardProps {
  title: string;
  questionCount: number;
  completedCount: number;
  correctCount: number;
  isStarted: boolean;
  hasPremium: boolean;
  onClick: () => void;
}

export function CategoryCard({ 
  title, 
  questionCount, 
  completedCount,
  correctCount,
  isStarted,
  hasPremium,
  onClick 
}: CategoryCardProps) {
  const { isPremium } = useAuth();
  const progress = (completedCount / questionCount) * 100;
  const accuracy = completedCount > 0 ? (correctCount / completedCount) * 100 : 0;
  const buttonText = isStarted ? 'Continue Training' : 'Start Training';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{title}</h3>
        {hasPremium && isPremium && (
          <div className="flex items-center text-yellow-600" title="Premium Content Available">
            <Crown className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isStarted && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Accuracy</span>
              <span>{Math.round(accuracy)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  accuracy >= 80 ? "bg-green-500" : 
                  accuracy >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          {correctCount} of {questionCount} completed correctly
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        {buttonText}
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
}