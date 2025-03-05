import React, { useEffect, useState } from 'react';
import { questionBank } from '@/services/questionBank';
import { CategoryCard } from './CategoryCard';
import { CategoryHeader } from './CategoryHeader';
import { useProgressStore } from '@/store/useProgressStore';
import { Question } from '@/types/question';
import { QuestionCard } from '../exam/QuestionCard';
import { useTrainingStore } from '@/store/useTrainingStore';
import { useAuth } from '@/contexts/AuthContext';
import { Transition } from '@headlessui/react';

const areAllAnswersCorrect = (selectedAnswers: number[], correctAnswers: number | number[], requiredAnswers: number = 1) => {
  // Convert single number to array if needed
  const correctAnswerArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  console.log('TrainingDeck - Answer Check:', {
    selectedAnswers,
    correctAnswerArray,
    requiredAnswers,
    selectedLength: selectedAnswers.length,
    correctLength: correctAnswerArray.length,
  });

  // For single answer questions
  if (requiredAnswers === 1) {
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

export function TrainingDeck() {
  const [categories, setCategories] = React.useState<Array<{ name: string; count: number; hasPremium: boolean }>>([]);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const { 
    selectedCategory,
    questions,
    currentQuestionIndex,
    selectedAnswers,
    isSubmitted,
    setSelectedCategory,
    setQuestions,
    setCurrentQuestionIndex,
    setAnswer,
    setIsSubmitted,
    resetTraining,
    setPreviousPath
  } = useTrainingStore();
  
  const { getCategoryProgress, updateProgress, startNewTrainingSession } = useProgressStore();
  const { isPremium } = useAuth();

  useEffect(() => {
    setSessionScore(null);
    setIsSubmitted(false);
  }, [selectedCategory, setIsSubmitted]);

  useEffect(() => {
    const initializeCategories = async () => {
      await questionBank.initialize();
      
      // Get categories based on user's subscription status
      const allCategories = questionBank.getCategories({ isPremium });
      
      const categoriesWithInfo = allCategories.map(category => {
        const basicCount = questionBank.getCategoryCount(category, { isPremium: false });
        const totalCount = questionBank.getCategoryCount(category, { isPremium: true });
        return {
          name: category,
          count: isPremium ? totalCount : basicCount,
          hasPremium: totalCount > basicCount
        };
      });
      
      setCategories(categoriesWithInfo);
    };
    initializeCategories();
  }, [isPremium]);

  const handleStartTraining = (category: string) => {
    // Get all questions for the category based on subscription status
    const categoryQuestions = questionBank.getQuestionsByCategory(category, { isPremium });
    
    // Process questions to ensure correct answer arrays and required answers
    const processedQuestions = categoryQuestions.map(question => {
      // Check if question has multiple answers (correctAnswers property)
      const hasMultipleAnswers = 'correctAnswers' in question && 
        Array.isArray((question as any).correctAnswers);
      
      if (hasMultipleAnswers) {
        const multiAnswerQuestion = question as Question & { correctAnswers: number[] };
        console.log('Processing multi-answer question:', {
          id: multiAnswerQuestion.id,
          correctAnswers: multiAnswerQuestion.correctAnswers,
          requiredAnswers: multiAnswerQuestion.correctAnswers.length
        });
        return {
          ...multiAnswerQuestion,
          correctAnswer: multiAnswerQuestion.correctAnswers,
          requiredAnswers: multiAnswerQuestion.correctAnswers.length
        };
      }
      
      // Single answer question (correctAnswer property)
      console.log('Processing single-answer question:', {
        id: question.id,
        correctAnswer: question.correctAnswer,
        requiredAnswers: 1
      });
      return {
        ...question,
        correctAnswer: [question.correctAnswer] as number[],
        requiredAnswers: 1
      };
    });

    console.log('TrainingDeck - Loading Questions:', processedQuestions.map(q => ({
      id: q.id,
      correctAnswer: q.correctAnswer,
      requiredAnswers: q.requiredAnswers
    })));

    const shuffledQuestions = [...processedQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, processedQuestions.length));
    
    // Start new training session with question count
    startNewTrainingSession(category, shuffledQuestions.length);
    
    // Reset session state
    setSessionScore(null);
    setQuestions(shuffledQuestions);
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setAnswer('', 0); // Reset answers
    setIsSubmitted(false);
  };

  const handleAnswer = (questionId: string, answerId: number) => {
    console.log('TrainingDeck - Handle Answer:', {
      questionId,
      answerId,
      currentAnswers: selectedAnswers[questionId],
      allAnswers: selectedAnswers
    });
    setAnswer(questionId, answerId);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    console.log('TrainingDeck - Submit Start:', {
      selectedAnswers,
      questions: questions.map(q => ({
        id: q.id,
        correctAnswer: q.correctAnswer,
        requiredAnswers: q.requiredAnswers
      }))
    });
    
    let sessionCorrectCount = 0;
    
    questions.forEach(question => {
      const answer = selectedAnswers[question.id];
      const selectedAnswerArray = answer
        ? (Array.isArray(answer) ? answer : [answer]) as number[]
        : [];
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      const requiredAnswers = question.requiredAnswers || 1;
      
      console.log('TrainingDeck - Processing Question:', {
        questionId: question.id,
        selectedAnswerArray,
        correctAnswers,
        requiredAnswers,
        answer,
        isArray: Array.isArray(answer)
      });
      
      const isCorrect = areAllAnswersCorrect(selectedAnswerArray, correctAnswers, requiredAnswers);
      
      if (isCorrect) {
        sessionCorrectCount++;
      }
      
      updateProgress(selectedCategory!, question.id, isCorrect);
    });

    const score = Math.round((sessionCorrectCount / questions.length) * 100);
    setSessionScore(score);

    console.log('TrainingDeck - Submit Complete:', {
      sessionCorrectCount,
      totalQuestions: questions.length,
      score
    });
  };

  const handleReturn = () => {
    resetTraining();
    setSessionScore(null);
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
          <div className="mb-6 flex justify-between items-center">
            <div className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <Transition
              show={isSubmitted}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="text-lg font-semibold text-blue-600">
                Score: {sessionScore !== null ? `${sessionScore}%` : 'Calculating...'}
              </div>
            </Transition>
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
        {categories.map(({ name, count, hasPremium }) => {
          const progress = getCategoryProgress(name);
          // Calculate total questions based on all attempts
          const totalQuestions = count * (progress.totalAttempts > 0 ? progress.totalAttempts : 1);
          
          return (
            <CategoryCard
              key={name}
              title={name}
              questionCount={count}
              completedCount={progress.completedCount}
              correctCount={progress.correctCount}
              totalQuestions={totalQuestions}
              totalAttempts={progress.totalAttempts}
              currentSessionCount={progress.currentSessionCount}
              isStarted={progress.completedCount > 0}
              hasPremium={hasPremium}
              onClick={() => handleStartTraining(name)}
            />
          );
        })}
      </div>
    </div>
  );
}