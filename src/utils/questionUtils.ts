/**
 * Utility function to check if selected answers are correct
 * Works for both single and multiple answer questions
 */
export const areAllAnswersCorrect = (
  selectedAnswers: number[], 
  correctAnswers: number | number[], 
  requiredAnswers: number = 1
) => {
  // Convert single number to array if needed
  const correctAnswerArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  console.log('Answer Check:', {
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