"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import OnboardingQuestionnaire, { QuestionnaireAnswers } from '@/components/OnboardingQuestionnaire';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error('All fields are required');
      }

      // Create user account
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const signupData = await signupResponse.json();
      console.log('Signup response:', signupData);

      if (!signupResponse.ok) {
        throw new Error(signupData.error || signupData.details || 'Failed to create account');
      }

      // Attempt to sign in
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
        callbackUrl: '/dashboard',
      });

      if (signInResult?.error) {
        console.error('Sign in error:', signInResult.error);
        throw new Error('Account created but failed to sign in automatically');
      }

      // Instead of redirecting, show questionnaire
      setShowQuestionnaire(true);
      
    } catch (error: any) {
      console.error('Signup process error:', error);
      setError(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (answers: QuestionnaireAnswers) => {
    try {
      console.log('Submitting onboarding answers:', answers);
      
      // Save questionnaire answers
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onboarding API error response:', errorData);
        throw new Error(errorData.error || errorData.details || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Onboarding response:', data);

      // Redirect to dashboard
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to save onboarding answers:', error);
      
      // Show error to user but still redirect to dashboard
      alert(`Warning: Could not save your preferences (${error.message}). You can update them later in your profile.`);
      
      // Redirect anyway
      router.push('/dashboard');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black flex flex-col overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[10rem] animate-float" />
          <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-primary/10 rounded-full blur-[10rem] animate-float" 
            style={{ animationDelay: '-10s' }}
          />
          <div className="absolute top-[50%] left-[50%] w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[10rem] animate-float"
            style={{ animationDelay: '-5s' }}
          />
        </div>

        {/* Navigation */}
        <nav className="p-6">
          <div className="max-w-7xl mx-auto flex items-center">
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => router.push('/')}
              className="mr-4 text-primary hover:text-primary/80 transition-colors"
              whileHover={{ scale: 1.1, rotate: -180 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </motion.button>
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-bold text-primary"
              >
                BugBesty
              </motion.div>
            </Link>
          </div>
        </nav>

        {/* Signup Form */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-primary/20
                hover:border-primary/30 transition-all duration-500"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-12 h-12 mx-auto mb-3 rounded-full bg-black/50
                    flex items-center justify-center border border-primary/30 
                    hover:border-primary/40 transition-all duration-300"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </motion.div>
                <h1 className="text-2xl font-bold mb-1 text-primary">
                  Create Account
                </h1>
                <p className="text-sm text-primary/70">Join the bug hunting community</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Name Input */}
                <motion.div className="group">
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                        focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300
                        group-hover:border-primary/40 placeholder-primary/30"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </motion.div>

                {/* Email Input */}
                <motion.div className="group">
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                        focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300
                        group-hover:border-primary/40 placeholder-primary/30"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password Input */}
                <motion.div className="group">
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                        focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300
                        group-hover:border-primary/40 placeholder-primary/30"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold
                    hover:bg-primary/90 transition-all duration-300 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              </form>

              <motion.div className="text-center mt-6">
                <p className="text-primary/70">
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login"
                    className="text-primary hover:text-primary/80 transition-colors duration-300 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQuestionnaire && (
          <OnboardingQuestionnaire
            onComplete={handleQuestionnaireComplete}
            onClose={() => setShowQuestionnaire(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 