
interface CategoryStrength {
  strongAreas: string[];
  weakAreas: string[];
}

interface CategoryStats {
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  completionPercentage: number;
  accuracyPercentage: number;
}

export const calculateCategoryStats = (
  category: string,
  progress: {
    completedCount: number;
    correctCount: number;
    answeredQuestions: Record<string, boolean>;
  },
  totalQuestions: number
): CategoryStats => {
  const completionPercentage = (progress.completedCount / totalQuestions) * 100;
  const accuracyPercentage = progress.completedCount > 0 
    ? (progress.correctCount / progress.completedCount) * 100 
    : 0;

  return {
    totalQuestions,
    completedQuestions: progress.completedCount,
    correctAnswers: progress.correctCount,
    completionPercentage,
    accuracyPercentage
  };
};

export const calculateStrengthAreas = (
  categories: Record<string, {
    completedCount: number;
    correctCount: number;
    answeredQuestions: Record<string, boolean>;
  }>
): CategoryStrength => {
  const strongThreshold = 85; // 85% accuracy
  const weakThreshold = 70;   // Below 70% accuracy
  const minAttempts = 5;      // Minimum attempts to classify

  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  Object.entries(categories).forEach(([category, data]) => {
    if (data.completedCount >= minAttempts) {
      const accuracy = (data.correctCount / data.completedCount) * 100;
      
      if (accuracy >= strongThreshold) {
        strongAreas.push(category);
      } else if (accuracy < weakThreshold) {
        weakAreas.push(category);
      }
    }
  });

  return {
    strongAreas,
    weakAreas
  };
};

export const getOverallProgress = (
  categories: Record<string, {
    completedCount: number;
    correctCount: number;
    answeredQuestions: Record<string, boolean>;
  }>
): number => {
  const total = Object.values(categories).reduce(
    (acc, curr) => acc + curr.completedCount,
    0
  );
  const correct = Object.values(categories).reduce(
    (acc, curr) => acc + curr.correctCount,
    0
  );

  return total > 0 ? Math.round((correct / total) * 100) : 0;
};