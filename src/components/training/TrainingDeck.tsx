import React, { useEffect, useState } from 'react';
import { questionBank } from '@/services/questionBank';
import { CategoryCard } from './CategoryCard';
import { CategoryHeader } from './CategoryHeader';
import { useProgressStore } from '@/store/useProgressStore';
import { Question } from '@/types/question';
import { QuestionCard } from '../exam/QuestionCard';

export function TrainingDeck() {
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | number[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { getCategoryProgress, updateProgress } = useProgressStore();

  useEffect(() => {
    const initializeCategories = async () => {
      await questionBank.initialize();
      const allCategories = questionBank.getCategories();
      const categoriesWithCount = allCategories.map(category => ({
        name: category,
        count: questionBank.getCategoryCount(category)
      }));
      setCategories(categoriesWithCount);
    };
    initializeCategories();
  }, []);

  const handleStartTraining = (category: string) => {
    // Get all questions for the category
    const categoryQuestions = questionBank.getQuestionsByCategory(category);
    const shuffledQuestions = [...categoryQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, categoryQuestions.length));
    
    // Initialize the training session
    setQuestions(shuffledQuestions);
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  //function to track which questions have been attempted for each category:
  const [attemptedQuestions, setAttemptedQuestions] = useState<Record<string, Set<string>>>({});
  
  const updateAttemptedQuestions = (category: string, questionId: string) => {
    setAttemptedQuestions(prev => {
      const categoryAttempts = prev[category] || new Set();
      categoryAttempts.add(questionId);
      return {
        ...prev,
        [category]: categoryAttempts
      };
    });
  };
  
  const handleAnswer = (questionId: string, answerId: number) => {
    setSelectedAnswers(prev => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return prev;

      const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      const requiredAnswers = correctAnswers.length;
      const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as number[] : 
                           prev[questionId] !== undefined ? [prev[questionId] as number] : [];

      // If answer is already selected, remove it (explicit deselection)
      if (currentAnswers.includes(answerId)) {
        const newAnswers = currentAnswers.filter(a => a !== answerId);
        // If no answers left, remove the entry completely
        if (newAnswers.length === 0) {
          const { [questionId]: _, ...rest } = prev;
          return rest;
        }
        // Otherwise keep the array of remaining answers
        return {
          ...prev,
          [questionId]: requiredAnswers === 1 ? newAnswers[0] : newAnswers
        };
      }


      // For all answer questions, add the new answer
      return {
        ...prev,
        [questionId]: [...currentAnswers, answerId]
      };
    });
    if (selectedCategory) {
      updateAttemptedQuestions(selectedCategory, questionId);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

const handleSubmit = () => {
  setIsSubmitted(true);
    
  // Calculate correct answers for this session
  let sessionCorrectCount = 0;
  
  // Update progress for answered questions
  Object.entries(selectedAnswers).forEach(([questionId, answerId]) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      const selectedAnswerArray = Array.isArray(answerId) ? answerId : [answerId];
      
      // For multiple answers, all selected answers must be correct and match the required count
      const isCorrect = selectedAnswerArray.length === correctAnswers.length &&
        selectedAnswerArray.every((answer: number) => correctAnswers.includes(answer));
      
      if (isCorrect) {
        sessionCorrectCount++;
      }
      // Update progress in the store
      updateProgress(selectedCategory!, questionId, isCorrect);
    }
  });

  // Update the progress display immediately
  const progress = getCategoryProgress(selectedCategory!);

  // Update progress for each question
  questions.forEach(q => {
    const answers = selectedAnswers[q.id];
    if (answers === undefined) return;
    
    const selectedAnswerArray = Array.isArray(answers) ? answers : [answers];
    const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
    const isCorrect = selectedAnswerArray.length === correctAnswers.length &&
      selectedAnswerArray.every((answer: number) => correctAnswers.includes(answer));
    useProgressStore.getState().updateProgress(q.category, q.id, isCorrect);
  });
};
  

  const handleReturn = () => {
    setSelectedCategory(null);
    setQuestions([]);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  if (selectedCategory && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = getCategoryProgress(selectedCategory);

    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={handleReturn}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Categories
          </button>
          <h2 className="text-2xl font-bold mb-2">{selectedCategory}</h2>
          <div className="text-gray-600">
            Progress: {progress.correctCount} / {questions.length} correct
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswers[currentQuestion.id]}
          onAnswer={(answerId) => handleAnswer(currentQuestion.id, answerId)}
          showResult={isSubmitted}
          isSubmitted={isSubmitted}
        />

        <div className="mt-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitted}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <CategoryHeader categories={categories} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(({ name, count }) => {
          const progress = getCategoryProgress(name);
          return (
            <CategoryCard
              key={name}
              title={name}
              questionCount={count}
              completedCount={progress.completedCount}
              correctCount={progress.correctCount}
              isStarted={progress.completedCount > 0}
              onClick={() => handleStartTraining(name)}
            />
          );
        })}
      </div>
    </div>
  );
}