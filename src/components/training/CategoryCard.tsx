import React from 'react';
import { Book, ArrowRight, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressStore } from '@/store/useProgressStore';

interface CategoryCardProps {
  title: string;
  questionCount: number;
  completedCount: number;
  correctCount: number;
  isStarted: boolean;
  hasPremium: boolean;
  totalQuestions?: number;
  totalAttempts?: number;
  currentSessionCount?: number;
  onClick: () => void;
}

export function CategoryCard({ 
  title, 
  questionCount, 
  completedCount,
  correctCount,
  isStarted,
  hasPremium,
  totalQuestions,
  totalAttempts = 0,
  currentSessionCount = 0,
  onClick 
}: CategoryCardProps) {
  const { isPremium } = useAuth();
  const progress = useProgressStore(state => state.getCategoryProgress(title));
  
  // Calculate progress based on current session
  const sessionProgress = progress.totalCount > 0 
    ? Math.min((progress.currentSessionCount / progress.totalCount) * 100, 100)
    : 0;
  
  // Calculate accuracy based on completed questions
  const accuracy = completedCount > 0 ? (correctCount / completedCount) * 100 : 0;
  
  // Calculate total questions based on all attempts
  const effectiveTotalQuestions = questionCount * (totalAttempts > 0 ? totalAttempts : 1);
  
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
            <span>{Math.round(sessionProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                sessionProgress === 100 ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${sessionProgress}%` }}
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
          <div>Completed {correctCount} of {effectiveTotalQuestions} correctly</div>
          {totalAttempts > 0 && (
            <div className="text-gray-500">
              Total attempts: {totalAttempts}
            </div>
          )}
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