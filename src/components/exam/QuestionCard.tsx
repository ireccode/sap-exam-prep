import React, { useState, useEffect } from 'react';
import { Question } from '../../types/question';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '@/store/useExamStore';
import { Crown, Check, X } from 'lucide-react';
import { areAllAnswersCorrect } from '@/utils/questionUtils';

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
  showResult = false,
  isSubmitted = false
}: QuestionCardProps) {
  const navigate = useNavigate();
  const setPreviousPath = useExamStore(state => state.setPreviousPath);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  
  useEffect(() => {
    if (selectedAnswer !== undefined) {
      setSelectedAnswers(Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer]);
    } else {
      setSelectedAnswers([]);
    }
  }, [selectedAnswer]);

  const handleAnswerClick = (answerId: number) => {
    if (isSubmitted) return;

    let newSelectedAnswers: number[];
    
    // For questions with multiple correct answers
    if (question.requiredAnswers && question.requiredAnswers > 1) {
      if (selectedAnswers.includes(answerId)) {
        // Remove if already selected
        newSelectedAnswers = selectedAnswers.filter(id => id !== answerId);
      } else {
        // Add to selection
        newSelectedAnswers = [...selectedAnswers, answerId];
      }
    } else {
      // For single answer questions, replace the selection
      newSelectedAnswers = [answerId];
    }
    
    setSelectedAnswers(newSelectedAnswers);
    
    // If it's a single answer question, notify parent immediately
    if (question.requiredAnswers === 1) {
      onAnswer(answerId);
    } else {
      // For multiple answers, we need to call onAnswer with the last clicked answer
      // The parent component will handle tracking all selected answers
      onAnswer(answerId);
    }
  };

  const handleMoreDetails = () => {
    setPreviousPath(window.location.pathname);
    navigate('/ai-chat', { 
      state: { 
        query: `${question.explanation} Provide more details from SAP documentation` 
      } 
    });
  };

  const isAnswerCorrect = (answerId: number) => {
    const correctAnswerArray = Array.isArray(question.correctAnswer) 
      ? question.correctAnswer 
      : [question.correctAnswer];
    return correctAnswerArray.includes(answerId);
  };

  const isQuestionCorrect = () => {
    const correctAnswerArray = Array.isArray(question.correctAnswer) 
      ? question.correctAnswer 
      : [question.correctAnswer];
    return areAllAnswersCorrect(selectedAnswers, correctAnswerArray, question.requiredAnswers || 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">
          {question.question}
          {question.requiredAnswers > 1 && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              (Select {question.requiredAnswers} answers - Selected {selectedAnswers.length})
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
          const isCorrect = isAnswerCorrect(index);

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