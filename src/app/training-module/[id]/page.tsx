"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface TrainingTopic {
  _id: string;
  name: string;
  description: string;
  severity: string;
  category: string;
  impact: string[];
  prevention: string[];
}

export default function TrainingContentPage() {
  const router = useRouter();
  const params = useParams();
  const [topic, setTopic] = useState<TrainingTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopic();
  }, [params.id]);

  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/training/${params.id}`);
      const data = await response.json();
      setTopic(data);
    } catch (error) {
      console.error('Failed to fetch topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Topic not found</h2>
          <button
            onClick={() => router.push('/training-module')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Training Modules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push('/training-module')}
        className="fixed top-8 left-8 z-50 w-10 h-10 bg-secondary/50 backdrop-blur-sm rounded-full 
          flex items-center justify-center hover:bg-secondary/70 transition-all border border-primary/10"
      >
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </motion.button>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            {topic.category}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold text-primary mb-6"
          >
            {topic.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center items-center gap-4 mb-8"
          >
            <span className={`px-4 py-2 rounded-full text-sm font-medium
              ${topic.severity === 'High' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : topic.severity === 'Medium'
                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                : 'bg-green-500/10 text-green-500 border border-green-500/20'
              }`}
            >
              {topic.severity} Severity
            </span>
          </motion.div>
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Overview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-secondary/30 backdrop-blur-xl rounded-xl p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-primary mb-6">Overview</h2>
            <p className="text-lg text-foreground/70 leading-relaxed">{topic.description}</p>
          </motion.div>

          {/* Impact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/30 backdrop-blur-xl rounded-xl p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-primary mb-6">Impact Analysis</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {topic.impact.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">{index + 1}</span>
                    </div>
                    <div className="h-px flex-grow bg-primary/10"></div>
                  </div>
                  <p className="text-lg text-foreground/70">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Prevention Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-secondary/30 backdrop-blur-xl rounded-xl p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-primary mb-6">Prevention Measures</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {topic.prevention.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="h-px flex-grow bg-primary/10"></div>
                  </div>
                  <p className="text-lg text-foreground/70">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Additional Resources Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-secondary/30 backdrop-blur-xl rounded-xl p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-primary mb-6">Related Resources</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-background/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">OWASP Guidelines</h3>
                <p className="text-foreground/70 mb-4">Access comprehensive security guidelines and best practices.</p>
                <a href="https://owasp.org" target="_blank" rel="noopener noreferrer" 
                  className="text-primary hover:text-primary/80 flex items-center gap-2">
                  Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
              <div className="bg-background/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">Security Tools</h3>
                <p className="text-foreground/70 mb-4">Explore recommended security testing and prevention tools.</p>
                <a href="#" className="text-primary hover:text-primary/80 flex items-center gap-2">
                  View Tools
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 