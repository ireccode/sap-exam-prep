import React, { useEffect } from 'react';
import { useExamStore } from '@/store/useExamStore';
import { questionBank } from '@/services/questionBank';
import { QuestionCard } from './QuestionCard';
import { ExamSetup } from './ExamSetup';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';

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
  } = useExamStore();

  useEffect(() => {
    const loadQuestions = async () => {
      console.log('Initializing question bank...');
      try {
        await questionBank.initialize();
        const loadedQuestions = await questionBank.getRandomQuestions(3);
        console.log('Initial questions loaded:', loadedQuestions);
      } catch (error) {
        console.error('Failed to initialize question bank:', error);
      }
    };
    loadQuestions();
  }, []);

  const handleStartExam = async (config: { duration: number; questionCount: number }) => {
    console.log('Starting exam with config:', config);
    const examQuestions = await questionBank.getRandomQuestions(config.questionCount);
    console.log('Loaded exam questions:', examQuestions);
    setQuestions(examQuestions);
    setCurrentQuestion(examQuestions[0]);
    startExam({
      ...config,
      duration: config.duration * 60 // Convert minutes to seconds
    });
  };
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (examStarted && timeRemaining > 0 && !isSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [examStarted, isSubmitted]); 


  useEffect(() => {
    console.log('Exam state updated:', {
      examStarted,
      questions: questions.length,
      currentQuestion: currentQuestion?.id
    });
  }, [examStarted, questions, currentQuestion]);

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
    const correct = questions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;
    setCorrectAnswers(correct);
    setIsSubmitted(true);
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
        
        {/* Add centered score */}
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
