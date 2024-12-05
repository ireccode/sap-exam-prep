import React from 'react';
import { Question } from '../../types/question';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number;
  onAnswer: (answerId: number) => void;
  showResult?: boolean;
  isSubmitted?: boolean;  // Add this prop
}

export function QuestionCard({ 
  question, 
  selectedAnswer, 
  onAnswer, 
  showResult,
  isSubmitted 
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isSubmitted && onAnswer(index)}
            disabled={isSubmitted}
            className={cn(
              "w-full text-left p-4 rounded-lg border transition-colors",
              selectedAnswer === undefined
                ? "border-gray-200 hover:bg-gray-50"
                : selectedAnswer === index
                ? isSubmitted
                  ? index === question.correctAnswer
                    ? "bg-green-100 border-green-500"
                    : "bg-red-100 border-red-500"
                  : "bg-blue-100 border-blue-500"
                : isSubmitted && index === question.correctAnswer
                  ? "bg-green-100 border-green-500"
                  : "border-gray-200 hover:bg-gray-50",
              isSubmitted && "cursor-not-allowed"
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {isSubmitted && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}