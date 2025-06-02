"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                BugBesty
              </span>
            </div>
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-8 mr-8">
                <Link href="#features" className="text-foreground/70 hover:text-orange-500 transition-colors">Features</Link>
                <Link href="#workflow" className="text-foreground/70 hover:text-orange-500 transition-colors">Workflow</Link>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  href="/auth/login" 
                  className="px-6 py-2 border border-orange-500/50 text-foreground/70 rounded-full 
                    hover:text-orange-500 hover:border-orange-500 transition-all"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Animated glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-40">
              <div className="absolute inset-0 bg-orange-500/30 blur-[80px] rounded-full animate-glow-pulse"></div>
            </div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight relative z-10"
            >
              Streamline Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">Bug Bounty</span> Workflow
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-foreground/70 mb-10 relative z-10"
            >
              Professional tools for serious bug bounty hunters. Track, manage, and optimize your hunting process.
            </motion.p>
            <motion.div 
              variants={itemVariants}
              className="flex gap-4 justify-center relative z-10"
            >
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg font-bold
                  hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/20"
              >
                Start Free Trial
              </button>
            </motion.div>
        </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Advanced Bug Hunting Tools</h2>
            <p className="text-foreground/70 mb-6">
              Our comprehensive suite of tools is designed to streamline your bug hunting workflow, 
              from initial reconnaissance to final report submission
            </p>
            <p className="text-sm text-foreground/50">
              Premium features available with paid plans
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Automated Reconnaissance */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-orange-500/10 backdrop-blur-sm hover:bg-secondary/70 transition-all">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Reconnaissance</h3>
              <p className="text-foreground/70 mb-4">
                Advanced subdomain enumeration engine that automates your initial reconnaissance phase. 
                Discover hidden assets and potential entry points automatically.
              </p>
              <ul className="space-y-2 text-sm text-foreground/70 mb-4">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automated subdomain discovery and validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time status monitoring and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant visual confirmation with screenshots</span>
                </li>
              </ul>
            </div>

            {/* AI Report Generation */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-orange-500/10 backdrop-blur-sm hover:bg-secondary/70 transition-all">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Report Generation</h3>
              <p className="text-foreground/70 mb-4">
                Transform your findings into professional, platform-ready reports with our AI-powered system. 
                Save hours of manual documentation work.
              </p>
              <ul className="space-y-2 text-sm text-foreground/70 mb-4">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Intelligent vulnerability description generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automatic proof-of-concept formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Platform-specific report templates</span>
                </li>
              </ul>
            </div>

            {/* Progress Analytics */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-orange-500/10 backdrop-blur-sm hover:bg-secondary/70 transition-all">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Analytics</h3>
              <p className="text-foreground/70 mb-4">
                Comprehensive analytics dashboard to track your bug hunting progress, success rates, 
                and identify patterns in your findings.
              </p>
              <ul className="space-y-2 text-sm text-foreground/70 mb-4">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Vulnerability trend analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Performance metrics and insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-center text-foreground/70 mb-16 max-w-3xl mx-auto">
              Our streamlined workflow helps you manage your bug hunting process efficiently from start to finish
            </p>
            
            <div className="space-y-12">
              <div className="flex items-start gap-8 p-8 rounded-xl bg-secondary/30 border border-orange-500/10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl font-bold text-orange-500">1</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Project Setup</h3>
                  <p className="text-foreground/70 mb-4">
                    Start by creating a new project and entering your target domain. For free users, upload your subdomain list via text file. 
                    Premium users get instant access to our automated subdomain enumeration system.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Easy project configuration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Flexible subdomain import options</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-8 p-8 rounded-xl bg-secondary/30 border border-orange-500/10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl font-bold text-orange-500">2</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Subdomain Management</h3>
                  <p className="text-foreground/70 mb-4">
                    View and manage all your subdomains in one place. Premium users get access to automated screenshots and 
                    real-time monitoring of subdomain changes. Track the status of each subdomain as you progress.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Organized subdomain listing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Visual status tracking</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-8 p-8 rounded-xl bg-secondary/30 border border-orange-500/10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl font-bold text-orange-500">3</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Vulnerability Assessment</h3>
                  <p className="text-foreground/70 mb-4">
                    For each subdomain, track potential vulnerabilities using our comprehensive template system. 
                    Mark findings as "Found" or "Not Found" as you investigate. Add detailed notes and evidence for each vulnerability.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Pre-built vulnerability templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Detailed finding management</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-8 p-8 rounded-xl bg-secondary/30 border border-orange-500/10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl font-bold text-orange-500">4</div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Report Generation</h3>
                  <p className="text-foreground/70 mb-4">
                    Premium users can leverage our AI-powered system to automatically generate professional vulnerability reports. 
                    Free users can export basic findings in a structured format. All reports are formatted to meet bug bounty platform requirements.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Professional report formatting</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Platform-ready submissions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Whether you're just starting out or running a professional bug hunting operation, 
              we have the right tools for you. Select a plan that matches your needs and scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-xl bg-secondary/50 border border-orange-500/10 backdrop-blur-sm">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
                <p className="text-foreground/70 mb-4">Essential tools for beginners</p>
                <div className="text-3xl font-bold text-orange-500">$0</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Manual Subdomain Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic Vulnerability Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 3 Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic Project Management</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>No Automated Enumeration</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>No AI Report Generation</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full px-6 py-3 rounded-lg bg-secondary text-foreground font-semibold
                  hover:bg-secondary/80 transition-all duration-300 border border-orange-500/20"
              >
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                  Recommended
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium Plan</h3>
                <p className="text-foreground/70 mb-4">Advanced tools for professional hunters</p>
                <div className="text-3xl font-bold text-orange-500">$29/month</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Free Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Automated Subdomain Enumeration</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-Powered Report Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority Support</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/auth/signup?plan=premium')}
                className="w-full px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold
                  hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/20"
              >
                Get Premium
              </button>
            </div>

            {/* Custom Enterprise Plan */}
            <div className="p-8 rounded-xl bg-gradient-to-b from-secondary/50 to-secondary/30 border border-orange-500/20 backdrop-blur-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-full">
                  Enterprise
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Custom Plan</h3>
                <p className="text-foreground/70 mb-4">Tailored solutions for teams and organizations</p>
                <div className="text-xl font-bold text-orange-500">Custom Pricing</div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom Integration Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated Account Manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom Feature Development</span>
                </div>
              </div>

              <button
                onClick={() => window.location.href = 'mailto:contact@bugbesty.com'}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold
                  hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-orange-500/20"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-orange-500/10 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-orange-500">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-foreground/70 hover:text-orange-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:gebin.official@gmail.com">gebin.official@gmail.com</a>
                </li>
                <li className="flex items-center gap-2 text-foreground/70 hover:text-orange-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+919741301245">+91-9741301245</a>
                </li>
              </ul>
            </div>

            {/* Project Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-orange-500">About Project</h3>
              <p className="text-foreground/70">
                This project was developed as part of the academic curriculum at Christ University.
                It serves as a demonstration of modern web development techniques and security tools.
              </p>
            </div>

            {/* Copyright */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-orange-500">Legal</h3>
              <div className="text-foreground/70 space-y-3">
                <p>© 2024 BugBesty. All rights reserved.</p>
                <p className="text-sm">
                  Academic Project - Christ University
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
