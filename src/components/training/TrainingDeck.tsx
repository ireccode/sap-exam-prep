import React, { useEffect, useState } from 'react';
import { questionBank } from '@/services/questionBank';
import { CategoryCard } from './CategoryCard';
import { useProgressStore } from '@/store/useProgressStore';
import { Shield } from 'lucide-react';
import { Question } from '@/types/question';

export function TrainingDeck() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<Question[]>([]);
  const { getCategoryProgress } = useProgressStore();

  useEffect(() => {
    const loadCategories = async () => {
      await questionBank.initialize();
      setCategories(questionBank.getCategories());
    };
    loadCategories();
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const questions = questionBank.getQuestionsByCategory(category);
    setCategoryQuestions(questions);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <Shield className="w-12 h-12 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold">Training Deck</h1>
      </div>

      {selectedCategory ? (
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Categories
          </button>
          <h2 className="text-2xl font-bold mb-4">{selectedCategory}</h2>
          <div className="space-y-4">
            {categoryQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={() => {}}
                showResult={false}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const questions = questionBank.getQuestionsByCategory(category);
            const progress = getCategoryProgress(category);
            
            return (
              <CategoryCard
                key={category}
                title={category}
                questionCount={questions.length}
                completedCount={progress.completedCount}
                onClick={() => handleCategorySelect(category)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}