"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingQuestionnaireProps {
  onComplete: (answers: QuestionnaireAnswers) => void;
  onClose: () => void;
}

export interface QuestionnaireAnswers {
  source: string;
  experience: string;
  goal: string;
}

export default function OnboardingQuestionnaire({ onComplete, onClose }: OnboardingQuestionnaireProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    source: '',
    experience: '',
    goal: '',
  });

  const sources = [
    'Google Search',
    'Social Media',
    'Friend/Colleague',
    'University/College',
    'Other'
  ];

  const experienceLevels = [
    'Beginner (Just starting)',
    'Intermediate (Some experience)',
    'Advanced (Professional)',
    'Expert (Years of experience)'
  ];

  const goals = [
    'Learn Web Security',
    'Professional Bug Hunting',
    'Academic Research',
    'Security Assessment',
    'Other'
  ];

  const slides = [
    {
      title: "Where did you hear about us?",
      options: sources,
      key: 'source' as keyof QuestionnaireAnswers,
    },
    {
      title: "Your experience in web penetration testing?",
      options: experienceLevels,
      key: 'experience' as keyof QuestionnaireAnswers,
    },
    {
      title: "Primary goal of using BugBesty?",
      options: goals,
      key: 'goal' as keyof QuestionnaireAnswers,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSelect = (value: string) => {
    const currentKey = slides[currentSlide].key;
    setAnswers(prev => ({ ...prev, [currentKey]: value }));
    // Automatically move to next slide after selection
    setTimeout(handleNext, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-primary/20 w-full max-w-md"
      >
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-primary' 
                  : index < currentSlide 
                    ? 'bg-primary/50'
                    : 'bg-primary/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">
                {slides[currentSlide].title}
              </h2>
              <p className="text-primary/70 text-sm">
                Step {currentSlide + 1} of {slides.length}
              </p>
            </div>

            <div className={`grid ${slides[currentSlide].key === 'experience' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {slides[currentSlide].options.map((option) => (
                <motion.button
                  key={option}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option)}
                  className={`p-3 rounded-xl text-sm transition-all duration-200
                    ${answers[slides[currentSlide].key] === option
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-black/50 border border-primary/20 text-primary/70 hover:border-primary/40'
                    }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              {currentSlide > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrevious}
                  className="px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                >
                  Back
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!answers[slides[currentSlide].key]}
                className={`px-6 py-2 rounded-lg ml-auto
                  ${currentSlide === slides.length - 1
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-primary/10'
                  } transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {currentSlide === slides.length - 1 ? 'Complete' : 'Skip'}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 