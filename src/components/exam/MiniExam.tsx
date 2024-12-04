import React, { useEffect } from 'react';
import { useExamStore } from '../../store/useExamStore';
import { QuestionCard } from './QuestionCard';
import { LoadingSpinner } from '../ui/loading-spinner';

export function MiniExam() {
  const { currentQuestion, questions, isLoading, loadQuestions, setCurrentQuestion, updateProgress } = useExamStore();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && !currentQuestion) {
      setCurrentQuestion(questions[0]);
    }
  }, [questions, currentQuestion]);

  const handleAnswer = (answerId: number) => {
    if (!currentQuestion) return;
    
    const isCorrect = answerId === currentQuestion.correctAnswer;
    updateProgress(currentQuestion.id, isCorrect ? 1 : 0);
    
    // Move to next question
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentIndex + 1]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 md:pb-0">
      {currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          showExplanation={false}
        />
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">No more questions available</h2>
          <p className="text-gray-600 mt-2">Check back later for new questions</p>
        </div>
      )}
    </div>
  );
}