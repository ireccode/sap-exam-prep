import React from 'react';
import { Question } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answerId: number) => void;
  showExplanation: boolean;
}

export function QuestionCard({ question, onAnswer, showExplanation }: QuestionCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            className="w-full text-left p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h4 className="font-semibold mb-2">Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}