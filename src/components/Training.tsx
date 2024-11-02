import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb } from 'lucide-react';

function Training() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 7;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">SAP Architecture Training</h2>
          <div className="flex items-center space-x-2">
            <BookOpen className="text-blue-600" />
            <Lightbulb className="text-blue-600" />
            <span className="text-gray-500">(00:18)</span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Question {currentQuestion} of {totalQuestions}</h3>
          <p className="text-gray-700">
            Sample training question about SAP architecture will appear here. This will be generated
            using GPT-4 once the backend is implemented.
          </p>
        </div>

        <div className="space-y-3">
          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, index) => (
            <button
              key={index}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go fish!
          </button>
          <button
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            onClick={() => setCurrentQuestion(Math.min(totalQuestions, currentQuestion + 1))}
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Training;