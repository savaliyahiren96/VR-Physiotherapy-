import React, { useState } from 'react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../../data/quizData';

interface QuizTabProps {
  onSelectMuscle: (muscleId: string) => void;
  setShowLandmarks: (show: boolean) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  onSelectMuscle,
  setShowLandmarks,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Prime Movers', 'Biomechanics & Torque', 'Accessory Glides', 'End-Feel', '3D Spotting'];

  const filteredQuestions = filterCategory === 'All'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter((q) => q.category === filterCategory);

  const question: QuizQuestion = filteredQuestions[currentIdx] || filteredQuestions[0];
  const selectedOption = selectedAnswers[currentIdx];
  const isAnswered = selectedOption !== undefined;
  const isCorrect = isAnswered && selectedOption === question.correctIndex;

  // Calculate overall score
  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = Object.entries(selectedAnswers).filter(
    ([idx, ans]) => filteredQuestions[parseInt(idx)]?.correctIndex === ans
  ).length;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: idx }));
    setShowExplanation(true);

    // If it's a 3D spotting task, highlight target in 3D automatically!
    if (question.isSpotting && question.spottingTarget) {
      onSelectMuscle(question.spottingTarget);
      setShowLandmarks(true);
    }
  };

  const handleNext = () => {
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx((c) => c + 1);
      setShowExplanation(selectedAnswers[currentIdx + 1] !== undefined);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((c) => c - 1);
      setShowExplanation(selectedAnswers[currentIdx - 1] !== undefined);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanation(false);
    setCurrentIdx(0);
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Quiz Progress & Score Header */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
            BPT Examination & 3D Spotting Quiz
          </span>
          <div className="text-xs text-slate-300 mt-0.5">
            Question <strong>{currentIdx + 1}</strong> of <strong>{filteredQuestions.length}</strong>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-white">
            Score: <span className="text-[#20b2aa]">{correctCount}</span> / {totalAnswered}
          </div>
          {totalAnswered > 0 && (
            <div className="text-[10px] text-slate-400">
              {Math.round((correctCount / totalAnswered) * 100)}% Accuracy
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setFilterCategory(cat);
              setCurrentIdx(0);
              setShowExplanation(false);
            }}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              filterCategory === cat
                ? 'bg-[#20b2aa] text-[#0b132b] font-bold border-[#fbbf24]'
                : 'bg-[#132247] text-slate-300 border-slate-700 hover:bg-[#1a2d5e]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="bg-[#0b1633] p-3.5 rounded-md border border-slate-700/80 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40">
            {question.category}
          </span>
          {question.isSpotting && (
            <span className="text-[10px] font-bold bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-600">
              3D Spotting Challenge
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-white leading-relaxed">
          {question.question}
        </p>

        {/* Options */}
        <div className="space-y-1.5">
          {question.options.map((option, idx) => {
            const isChosen = selectedOption === idx;
            const isOptionCorrect = question.correctIndex === idx;

            let btnStyle = 'bg-[#070e22] text-slate-200 border-slate-800 hover:border-teal-500';
            if (isAnswered) {
              if (isOptionCorrect) {
                btnStyle = 'bg-teal-950/80 border-teal-400 text-teal-200 font-bold';
              } else if (isChosen && !isOptionCorrect) {
                btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
              } else {
                btnStyle = 'bg-[#070e22] opacity-60 text-slate-400 border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full text-left p-2.5 rounded text-xs border transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && isOptionCorrect && (
                  <span className="text-teal-400 font-bold ml-2">✓ Correct</span>
                )}
                {isAnswered && isChosen && !isOptionCorrect && (
                  <span className="text-red-400 font-bold ml-2">✗ Incorrect</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Academic Explanation & Citation */}
        {showExplanation && (
          <div className={`p-3 rounded-md border text-xs space-y-1.5 ${
            isCorrect ? 'bg-teal-950/40 border-teal-600 text-teal-100' : 'bg-red-950/40 border-red-600 text-red-100'
          }`}>
            <strong className="block text-sm">
              {isCorrect ? 'Excellent! Correct Answer.' : 'Review Needed.'}
            </strong>
            <p className="leading-relaxed">{question.explanation}</p>
            <div className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-700/50">
              Citation: {question.citation}
            </div>
          </div>
        )}
      </div>

      {/* Navigation & Reset Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="text-xs px-3 py-1.5 bg-[#132247] hover:bg-[#1a2d5e] disabled:opacity-40 text-slate-200 rounded border border-slate-700 cursor-pointer"
        >
          Previous Question
        </button>

        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Reset Quiz
        </button>

        <button
          onClick={handleNext}
          disabled={currentIdx === filteredQuestions.length - 1}
          className="text-xs px-3 py-1.5 bg-[#20b2aa] hover:bg-[#14b8a6] disabled:opacity-40 text-[#0b132b] font-bold rounded border border-[#fbbf24] cursor-pointer"
        >
          Next Question
        </button>
      </div>
    </div>
  );
};
