"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface TrainingTopic {
  _id: string;
  name: string;
  description: string;
  severity: string;
  category: string;
  impact: string[];
  prevention: string[];
}

interface AddTopicFormData {
  name: string;
  description: string;
  severity: string;
  category: string;
  impact: string[];
  prevention: string[];
}

const vulnerabilityTopics = [
  {
    name: "SQL Injection",
    description: "SQL Injection is a code injection technique that might destroy your database.",
    severity: "High",
    category: "Injection",
    impact: ["Data Loss", "Information Disclosure", "Authentication Bypass"],
    prevention: [
      "Use Prepared Statements",
      "Input Validation",
      "Least Privilege Principle"
    ]
  },
  {
    name: "Cross-Site Scripting (XSS)",
    description: "XSS allows attackers to inject malicious scripts into web pages viewed by other users.",
    severity: "High",
    category: "Injection",
    impact: ["Session Hijacking", "Data Theft", "Defacement"],
    prevention: [
      "Input Sanitization",
      "Content Security Policy",
      "Output Encoding"
    ]
  },
  // Add more with similar detailed structure...
];

export default function TrainingModule() {
  const router = useRouter();
  const [selectedVulnerability, setSelectedVulnerability] = useState<TrainingTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<AddTopicFormData>({
    name: '',
    description: '',
    severity: 'High',
    category: '',
    impact: [''],
    prevention: ['']
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/training');
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTopics();
        setShowAddForm(false);
        setFormData({
          name: '',
          description: '',
          severity: 'High',
          category: '',
          impact: [''],
          prevention: ['']
        });
      }
    } catch (error) {
      console.error('Failed to add topic:', error);
    }
  };

  const addField = (field: 'impact' | 'prevention') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field: 'impact' | 'prevention', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateField = (field: 'impact' | 'prevention', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeTab === 'all' || topic.severity.toLowerCase() === activeTab)
  );

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 opacity-30">
          {/* Add some animated shapes */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.push('/dashboard')}
            className="fixed top-8 left-8 z-50 w-10 h-10 bg-secondary/50 backdrop-blur-sm rounded-full 
              flex items-center justify-center hover:bg-secondary/70 transition-all border border-primary/10"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </motion.button>

          <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24">
            <div className="flex flex-col items-center text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
              >
                Interactive Learning Platform
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-bold text-primary mb-6 gradient-text"
              >
                Security Training Hub
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-foreground/70 max-w-2xl mb-8"
              >
                Master the art of cybersecurity through our comprehensive vulnerability training platform.
                Learn, practice, and become an expert in identifying and preventing security threats.
              </motion.p>
              
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl mt-8">
                <div className="bg-secondary/30 rounded-xl p-6 backdrop-blur-sm border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">{topics.length}</div>
                  <div className="text-foreground/70">Vulnerability Topics</div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-6 backdrop-blur-sm border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-foreground/70">Access Available</div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-6 backdrop-blur-sm border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <div className="text-foreground/70">Practical Learning</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - without borders */}
        <div className="py-24 bg-gradient-to-b from-secondary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-primary mb-4">Why Learn With Us?</h2>
              <p className="text-xl text-foreground/70">Comprehensive security training designed for modern cybersecurity challenges</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-secondary/30 rounded-xl border border-primary/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Interactive Learning</h3>
                <p className="text-foreground/70">Learn through hands-on exercises and real-world scenarios</p>
              </div>

              <div className="p-6 bg-secondary/30 rounded-xl border border-primary/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Expert Content</h3>
                <p className="text-foreground/70">Curated by industry professionals and security experts</p>
              </div>

              <div className="p-6 bg-secondary/30 rounded-xl border border-primary/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Regular Updates</h3>
                <p className="text-foreground/70">Stay current with the latest security threats and defenses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Explore Vulnerabilities</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Dive deep into various security vulnerabilities and learn how to identify, prevent, and mitigate them.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-16 space-y-6 max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vulnerabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-background rounded-xl border border-primary/20 
                  focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all
                  text-white placeholder-white/50"
              />
              <svg 
                className="w-6 h-6 absolute right-6 top-1/2 transform -translate-y-1/2 text-primary/50"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Tabs */}
            <div className="flex justify-center space-x-4">
              {['all', 'high', 'medium', 'low'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'bg-background border border-primary/20 text-primary hover:bg-secondary/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Add Topic Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddForm(true)}
            className="fixed top-8 right-8 z-50 px-4 py-2 bg-primary text-white rounded-lg 
              hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Topic
          </motion.button>

          {/* Vulnerability Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden"
              >
                <div
                  onClick={() => router.push(`/training-module/${topic._id}`)}
                  className="p-6 bg-secondary/40 backdrop-blur-xl rounded-xl border border-primary/20 
                    hover:border-primary/40 transition-all cursor-pointer h-full
                    transform hover:-translate-y-1 hover:shadow-xl duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-primary">{topic.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${topic.severity === 'High' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}
                    >
                      {topic.severity}
                    </span>
                  </div>
                  <p className="text-foreground/70 mb-4 line-clamp-2">{topic.description}</p>
                  <span className="text-primary/60 text-sm">{topic.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Vulnerability Detail Modal */}
        <AnimatePresence>
          {selectedVulnerability && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedVulnerability(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-secondary/95 backdrop-blur-xl rounded-xl p-8 max-w-2xl w-full 
                  border border-primary/20 shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-primary">{selectedVulnerability.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${selectedVulnerability.severity === 'High' 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}
                  >
                    {selectedVulnerability.severity}
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary/80 mb-2">Description</h3>
                    <p className="text-foreground/70">{selectedVulnerability.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-primary/80 mb-2">Impact</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVulnerability.impact.map((item, index) => (
                        <li key={index} className="text-foreground/70">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-primary/80 mb-2">Prevention</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVulnerability.prevention.map((item, index) => (
                        <li key={index} className="text-foreground/70">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVulnerability(null)}
                  className="mt-8 px-6 py-3 bg-primary text-white rounded-lg 
                    hover:bg-primary/90 transition-colors w-full"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Topic Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-secondary/95 backdrop-blur-xl rounded-xl p-8 max-w-2xl w-full 
                  border border-primary/20 shadow-xl overflow-y-auto max-h-[90vh]"
              >
                <h2 className="text-2xl font-bold text-primary mb-6">Add New Training Topic</h2>
                <form onSubmit={handleAddTopic} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-background rounded-lg border border-primary/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-background rounded-lg border border-primary/20 h-32"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-4 py-2 bg-background rounded-lg border border-primary/20"
                      required
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 bg-background rounded-lg border border-primary/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Impact</label>
                    {formData.impact.map((impact, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={impact}
                          onChange={(e) => updateField('impact', index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-background rounded-lg border border-primary/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeField('impact', index)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addField('impact')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      + Add Impact
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">Prevention</label>
                    {formData.prevention.map((prevention, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={prevention}
                          onChange={(e) => updateField('prevention', index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-background rounded-lg border border-primary/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeField('prevention', index)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addField('prevention')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      + Add Prevention
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Topic
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 bg-background text-primary rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 