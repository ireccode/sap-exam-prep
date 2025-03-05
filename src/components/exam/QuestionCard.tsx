import React from 'react';
import { Question } from '../../types/question';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '@/store/useExamStore';
import { Crown, Check, X } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number | number[];
  onAnswer: (answerId: number) => void;
  showResult?: boolean;
  isSubmitted?: boolean;
}

const areAllAnswersCorrect = (selectedAnswers: number[], correctAnswers: number | number[]) => {
  // Convert single number to array if needed
  const correctAnswerArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  console.log('QuestionCard - Answer Check:', {
    selectedAnswers,
    correctAnswerArray,
    requiredAnswers: correctAnswerArray.length,
    selectedLength: selectedAnswers.length,
    correctLength: correctAnswerArray.length,
  });

  // For single answer questions
  if (correctAnswerArray.length === 1) {
    return selectedAnswers.length === 1 && correctAnswerArray.includes(selectedAnswers[0]);
  }

  // For multiple answer questions:
  // 1. Check if we have the right number of answers
  // 2. Check if all selected answers are in correctAnswers (order independent)
  // 3. Check if all correct answers are selected (order independent)
  const hasCorrectCount = selectedAnswers.length === correctAnswerArray.length;
  const allSelectedAreCorrect = selectedAnswers.every(answer => correctAnswerArray.includes(answer));
  const allCorrectAreSelected = correctAnswerArray.every(answer => selectedAnswers.includes(answer));

  console.log('Multiple Answer Check:', {
    hasCorrectCount,
    allSelectedAreCorrect,
    allCorrectAreSelected
  });

  return hasCorrectCount && allSelectedAreCorrect && allCorrectAreSelected;
};

export function QuestionCard({ 
  question, 
  selectedAnswer, 
  onAnswer, 
  showResult,
  isSubmitted 
}: QuestionCardProps) {
  const navigate = useNavigate();
  const setPreviousPath = useExamStore(state => state.setPreviousPath);
  
  // Ensure selectedAnswers is always an array
  const selectedAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : selectedAnswer !== undefined ? [selectedAnswer] : [];
  
  // Ensure correctAnswers is always an array and properly initialized
  const correctAnswers = Array.isArray(question.correctAnswer) ? 
    question.correctAnswer : 
    question.correctAnswer !== undefined ? [question.correctAnswer] : [];
  
  // Set requiredAnswers based on correctAnswers length if not specified
  const requiredAnswers = question.requiredAnswers || correctAnswers.length;

  const handleAnswerClick = (index: number) => {
    if (isSubmitted) return;
    onAnswer(index);
  };

  const handleMoreDetails = () => {
    setPreviousPath(window.location.pathname);
    navigate('/ai-chat', { 
      state: { 
        query: `${question.explanation} Provide more details from SAP documentation` 
      } 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">
          {question.question}
          {requiredAnswers > 1 && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              (Select {requiredAnswers} answers - Selected {selectedAnswers.length})
            </span>
          )}
        </h3>
        {question.isPremium && (
          <div className="flex items-center text-yellow-600" title="Premium Question">
            <Crown className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index);
          const isCorrect = correctAnswers.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(index)}
              disabled={isSubmitted}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-colors",
                isSubmitted
                  ? isCorrect
                    ? "bg-green-100 border-green-500" // Always show correct answers in green when submitted
                    : isSelected
                      ? "bg-red-100 border-red-500" // Show incorrect selections in red
                      : "border-gray-200" // Neutral for unselected options
                  : isSelected
                    ? "bg-blue-100 border-blue-500 hover:bg-blue-200"
                    : "border-gray-200 hover:bg-gray-50",
                isSubmitted && "cursor-not-allowed"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{option}</span>
                {isSubmitted && (
                  <div className="flex items-center">
                    {isCorrect ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : isSelected ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : null}
                  </div>
                )}
                {isSelected && !isSubmitted && (
                  <span className="text-sm text-gray-500">Click to deselect</span>
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
          <button
            onClick={handleMoreDetails}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            More details →
          </button>
        </div>
      )}
    </div>
  );
}