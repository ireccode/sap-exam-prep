import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Timer } from 'lucide-react';
import ExamSetup from './ExamSetup';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswers: string[];
}

const allQuestions: Question[] = [
  {
    id: 1,
    text: "As an analytics administrator you want to adapt reports in SAP Sales Cloud and SAP Service Cloud using standard functionality. What options are available to you?",
    options: [
      "Create a custom key figure",
      "Create a data source",
      "Design a report view",
      "Run real-time queries to external databases",
      "Design an SAP HANA view"
    ],
    correctAnswers: [
      "Create a custom key figure",
      "Create a data source",
      "Design a report view"
    ]
  },
  // Add all questions from the CSV here
];

function Exam() {
  const [showSetup, setShowSetup] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (timeRemaining > 0 && examStarted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && examStarted) {
      // End exam when time runs out
      setExamStarted(false);
      setShowResult(true);
    }
  }, [timeRemaining, examStarted]);

  const handleExamStart = (duration: number, questionCount: number) => {
    // Randomly select questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, questionCount));
    setTimeRemaining(duration * 60);
    setShowSetup(false);
    setExamStarted(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (option: string) => {
    const newSelectedAnswers = selectedAnswers.includes(option)
      ? selectedAnswers.filter(answer => answer !== option)
      : [...selectedAnswers, option];
    setSelectedAnswers(newSelectedAnswers);
  };

  const checkAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.correctAnswers.length === selectedAnswers.length &&
      currentQuestion.correctAnswers.every(answer => selectedAnswers.includes(answer));
    
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswers([]);
      setShowResult(false);
    }
  };

  if (showSetup) {
    return <ExamSetup onStart={handleExamStart} />;
  }

  if (!questions.length) {
    return <div>Loading questions...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">SAP Architecture Exam</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Timer className="text-blue-600" />
              <span className={`font-mono ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="text-blue-600" />
              <span className="text-gray-600">Score: {score}/{questions.length}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <p className="text-gray-700 mb-4">{currentQuestion.text}</p>
          <p className="text-sm text-gray-500 mb-4">
            Select {currentQuestion.correctAnswers.length} correct answer{currentQuestion.correctAnswers.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showResult && handleAnswerSelect(option)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedAnswers.includes(option)
                  ? showResult
                    ? currentQuestion.correctAnswers.includes(option)
                      ? 'bg-green-100 border-green-500'
                      : 'bg-red-100 border-red-500'
                    : 'bg-blue-100 border-blue-500'
                  : showResult && currentQuestion.correctAnswers.includes(option)
                  ? 'bg-green-100 border-green-500'
                  : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
              disabled={showResult || !examStarted}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-600 mb-2">Explanation</h4>
            <p className="text-gray-700">
              The correct answers are: {currentQuestion.correctAnswers.join(', ')}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>
          
          {!showResult ? (
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={checkAnswer}
              disabled={!examStarted}
            >
              Check Answer
            </button>
          ) : (
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next Question
            </button>
          )}
          
          <button
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Exam;