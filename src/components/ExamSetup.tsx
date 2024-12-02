import React, { useState } from 'react';
import { Timer, HelpCircle } from 'lucide-react';

interface ExamSetupProps {
  onStart: (duration: number, questionCount: number) => void;
}

function ExamSetup({ onStart }: ExamSetupProps) {
  const [duration, setDuration] = useState(1); // Minimum duration set to 1 minute
  const [questionCount, setQuestionCount] = useState(1); // Minimum question count set to 1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(duration, questionCount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Mini Exam Setup</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-blue-600 font-semibold mb-4">DURATION</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-gray-700 min-w-[100px]">{duration} minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-blue-600 font-semibold mb-4">QUESTIONS</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="30"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-gray-700 min-w-[100px]">{questionCount} questions</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExamSetup;
