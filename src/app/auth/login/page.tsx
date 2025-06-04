"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  // Check for error in URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError('Authentication failed. Please check your credentials and try again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: true,
        email: email.trim(),
        password: password.trim(),
        callbackUrl: '/dashboard',
      });

      // Router push removed as NextAuth will handle the redirect
      
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isResettingPassword) return;
    
    if (!forgotPasswordEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }
    
    setResetError('');
    setIsResettingPassword(true);
    
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      setResetEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setResetError('No account found with this email address');
      } else {
        setResetError('Failed to send reset email. Please try again later.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-primary/20"
          >
            {showForgotPassword ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2 text-primary">Reset Password</h1>
                  <p className="text-sm text-primary/70">
                    Enter your email to receive a password reset link
                  </p>
                </div>

                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg">
                      <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p>
                        Password reset link has been sent to your email address. 
                        Please check your inbox and spam folder.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setForgotPasswordEmail('');
                      }}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      Back to login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    {resetError && (
                      <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                        {resetError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isResettingPassword}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium
                          hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                      >
                        {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full px-4 py-2 bg-transparent border border-primary/20 text-primary rounded-lg font-medium
                          hover:bg-primary/10 transition-colors"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2 text-primary">Welcome Back</h1>
                  <p className="text-sm text-primary/70">Sign in to continue your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium text-primary">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotPasswordEmail(email);
                          }}
                          className="text-xs text-primary/70 hover:text-primary transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-primary/20 text-white
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium
                      hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-primary/70">
                    Don't have an account?{' '}
                    <Link 
                      href="/auth/signup"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 