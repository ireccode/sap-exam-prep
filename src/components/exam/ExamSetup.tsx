import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface ExamSetupProps {
  onStart: (config: { duration: number; questionCount: number }) => void;
}

export function ExamSetup({ onStart }: ExamSetupProps) {
  const [duration, setDuration] = useState(10);
  const [questionCount, setQuestionCount] = useState(10);

  const handleStart = () => {
    console.log('ExamSetup: Starting exam with config:', {
      duration,
      questionCount
    });
    
    onStart({
      duration: duration * 60, // Convert minutes to seconds
      questionCount
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-6">
        <Shield className="w-12 h-12 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6">Mini Exam Setup</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DURATION
          </label>
          <input
            type="range"
            min={1}
            max={40}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center mt-2">{duration} minutes</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QUESTIONS
          </label>
          <input
            type="range"
            min={1}
            max={40}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center mt-2">{questionCount} questions</div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Start Exam
        </button>
      </div>
    </div>
  );
}