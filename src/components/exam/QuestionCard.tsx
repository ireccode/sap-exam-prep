import React from 'react';
import { Question } from '../../types/question';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number | number[];
  onAnswer: (answerId: number) => void;
  showResult?: boolean;
  isSubmitted?: boolean;
}

export function QuestionCard({ 
  question, 
  selectedAnswer, 
  onAnswer, 
  showResult,
  isSubmitted 
}: QuestionCardProps) {
  const selectedAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : selectedAnswer !== undefined ? [selectedAnswer] : [];
  const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
  const requiredAnswers = correctAnswers.length; // Use the length of correctAnswers instead of requiredAnswers field

  const handleAnswerClick = (index: number) => {
    if (isSubmitted) return;
    onAnswer(index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        {question.question}
        {requiredAnswers > 1 && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            (Select {requiredAnswers} answers - Selected {selectedAnswers.length})
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(index)}
              disabled={isSubmitted}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-colors",
                isSelected
                  ? isSubmitted
                    ? correctAnswers.includes(index)
                      ? "bg-green-100 border-green-500"
                      : "bg-red-100 border-red-500"
                    : "bg-blue-100 border-blue-500 hover:bg-blue-200"
                  : isSubmitted && correctAnswers.includes(index)
                    ? "bg-green-100 border-green-500"
                    : "border-gray-200 hover:bg-gray-50",
                isSubmitted && "cursor-not-allowed",
                isSelected && !isSubmitted && "hover:bg-red-100 hover:border-red-500" // Hover style for deselection
              )}
            >
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {isSelected && !isSubmitted && (
                  <span className="text-sm text-gray-500">
                    Click to deselect
                  </span>
                )}
              </div>
            </button>
          );
        })}
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