import React, { useEffect, useState } from 'react';
import { useExamStore } from '@/store/useExamStore';
import { questionBank } from '@/services/questionBank';
import { QuestionCard } from './QuestionCard';
import { ExamSetup } from './ExamSetup';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProgressStore } from '@/store/useProgressStore';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/types/question';
import { areAllAnswersCorrect } from '@/utils/questionUtils';

export function MiniExam() {
  const {
    questions,
    currentQuestion,
    selectedAnswers,
    examStarted,
    timeRemaining,
    setQuestions,
    setCurrentQuestion,
    setAnswer,
    startExam,
    endExam,
    setTimeRemaining,
    isSubmitted,
    correctAnswers,
    setIsSubmitted,
    setCorrectAnswers,
    decrementTimer
  } = useExamStore();

  const { addExamResult } = useProgressStore();
  const { isPremium } = useAuth();
  const [examStartTime, setExamStartTime] = useState<Date>();

  useEffect(() => {
    const loadQuestions = async () => {
      await questionBank.loadQuestions(isPremium);
    };
    loadQuestions();
  }, []);

  const handleStartExam = async (config: { duration: number; questionCount: number }) => {
    const questions = await questionBank.getAdaptiveQuestions(config.questionCount, { isPremium });
    
    // Process questions to ensure consistent format
    const processedQuestions = questions.map(question => {
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
        correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer] as number[],
        requiredAnswers: 1
      };
    });

    console.log('MiniExam - Loading Questions:', processedQuestions.map(q => ({
      id: q.id,
      correctAnswer: q.correctAnswer,
      requiredAnswers: q.requiredAnswers
    })));

    setQuestions(processedQuestions);
    setCurrentQuestion(processedQuestions[0]);
    setTimeRemaining(config.duration * 60);
    setExamStartTime(new Date());

    startExam(config);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (examStarted && !isSubmitted && timeRemaining > 0) {
      timer = setInterval(() => {
        decrementTimer();
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStarted, isSubmitted, timeRemaining]);  

  const currentIndex = currentQuestion ? questions.indexOf(currentQuestion) : -1;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentQuestion(questions[currentIndex - 1]);
    }
  };

  const allQuestionsAnswered = () => {
    return questions.every(q => selectedAnswers[q.id] !== undefined);
  };

  const handleSubmit = () => {
    const correct = questions.filter(q => {
      const answers = selectedAnswers[q.id];
      if (answers === undefined) return false;
      
      const selectedAnswerArray = Array.isArray(answers) ? answers : [answers];
      const correctAnswers = q.correctAnswer;
      const requiredAnswers = q.requiredAnswers || 1;
      
      console.log('MiniExam - Checking Answer:', {
        questionId: q.id,
        selectedAnswerArray,
        correctAnswers,
        requiredAnswers
      });
      
      return areAllAnswersCorrect(selectedAnswerArray, correctAnswers, requiredAnswers);
    }).length;
    
    setCorrectAnswers(correct);
    setIsSubmitted(true);

    // Record exam history
    if (examStartTime) {
      const timeSpent = Math.floor((new Date().getTime() - examStartTime.getTime()) / 1000);
      const questionResults = questions.reduce((acc, q) => {
        const answers = selectedAnswers[q.id];
        if (answers === undefined) return { ...acc, [q.id]: false };
        
        const selectedAnswerArray = Array.isArray(answers) ? answers : [answers];
        const correctAnswers = q.correctAnswer;
        const requiredAnswers = q.requiredAnswers || 1;
        const isCorrect = areAllAnswersCorrect(selectedAnswerArray, correctAnswers, requiredAnswers);
        return {
          ...acc,
          [q.id]: isCorrect
        };
      }, {});

      addExamResult({
        id: Date.now().toString(),
        date: new Date(),
        score: correct,
        totalQuestions: questions.length,
        timeSpent,
        questionResults
      });

      // Update progress for each question
      questions.forEach(q => {
        const answers = selectedAnswers[q.id];
        if (answers === undefined) return;
        
        const selectedAnswerArray = Array.isArray(answers) ? answers : [answers];
        const correctAnswers = q.correctAnswer;
        const requiredAnswers = q.requiredAnswers || 1;
        const isCorrect = areAllAnswersCorrect(selectedAnswerArray, correctAnswers, requiredAnswers);
        useProgressStore.getState().updateProgress(q.category, q.id, isCorrect);
      });
    }
  };

  if (!examStarted) {
    return <ExamSetup onStart={handleStartExam} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="text-lg font-semibold">
          Question {currentIndex + 1} of {questions.length}
        </div>
        
        {isSubmitted && (
          <div className="text-lg font-semibold">
            Score: {correctAnswers}/{questions.length} ({Math.round(correctAnswers/questions.length * 100)}%)
          </div>
        )}
        
        <div className="flex items-center text-lg">
          <Clock className="w-5 h-5 mr-2" />
          {timeRemaining ? (
            `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2,'0')}`
          ) : (
            '00:00'
          )}
        </div>
      </div>

      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswers[currentQuestion.id]}
          onAnswer={(answerId) => setAnswer(currentQuestion.id, answerId)}
          showResult={isSubmitted}
          isSubmitted={isSubmitted}
        />
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitted || !allQuestionsAnswered()}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}