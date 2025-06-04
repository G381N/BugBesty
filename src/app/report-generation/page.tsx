"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateReport } from '@/services/reportGenerator';
import { saveAs } from 'file-saver';

interface Project {
  id: string;
  name: string;
}

interface Vulnerability {
  id: string;
  type: string;
  status: string;
  severity: 'High' | 'Medium' | 'Low' | 'Critical';
  notes?: string;
  recreation_steps?: string;
  updatedAt: string;
  subdomainId: string;
}

interface Subdomain {
  id: string;
  name: string;
  projectId: string;
}

interface FormData {
  reproductionSteps: string;
  additionalNotes: string;
}

const REPORT_STATUSES = ['Draft', 'Submitted', 'Acknowledged', 'Fixed', 'Pending'] as const;
const ASSIGNEE_OPTIONS = [
  { id: 'security-eng', name: 'Security Engineer' },
  { id: 'dev-team', name: 'Development Team' },
  { id: 'project-manager', name: 'Project Manager' },
  { id: 'other', name: 'Other' }
];

export default function ReportGeneration() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [vulnerabilities, setVulnerabilities] = useState<Record<string, Vulnerability[]>>({});
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    reproductionSteps: '',
    additionalNotes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [geminiApiAvailable, setGeminiApiAvailable] = useState(false);

  // Add function to check if Gemini API is available
  const checkGeminiApiAvailable = useCallback(async () => {
    try {
      const response = await fetch('/api/check-gemini-api');
      const data = await response.json();
      setGeminiApiAvailable(!!data.available);
    } catch (error) {
      console.error('Failed to check Gemini API availability:', error);
      setGeminiApiAvailable(false);
    }
  }, []);
  
  useEffect(() => {
    checkGeminiApiAvailable();
  }, [checkGeminiApiAvailable]);

  // Define fetchSubdomainsAndVulnerabilities using useCallback before it's used in useEffect
  const fetchSubdomainsAndVulnerabilities = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingStage('Fetching subdomains...');
      setLoadingProgress(10);
      
      // Fetch subdomains
      const subdomainsResponse = await fetch(`/api/projects/${selectedProject}/subdomains`);
      const subdomainsData = await subdomainsResponse.json();
      setSubdomains(subdomainsData);
      
      setLoadingProgress(30);
      setLoadingStage('Processing subdomains...');

      // Fetch vulnerabilities for each subdomain
      const vulnsMap: Record<string, Vulnerability[]> = {};
      
      for (let i = 0; i < subdomainsData.length; i++) {
        const subdomain = subdomainsData[i];
        setLoadingStage(`Fetching vulnerabilities for ${subdomain.name}...`);
        setLoadingProgress(30 + Math.floor((i / subdomainsData.length) * 60));
        
        const vulnsResponse = await fetch(`/api/subdomains/${subdomain.id}/vulnerabilities`);
        const vulnsData = await vulnsResponse.json();
        const foundVulns = vulnsData.filter((v: Vulnerability) => v.status === 'Found');
        if (foundVulns.length > 0) {
          vulnsMap[subdomain.id] = foundVulns;
        }
      }
      
      setVulnerabilities(vulnsMap);
      setLoadingProgress(100);
      setLoadingStage('Complete');
      
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Short delay to show the completed progress
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadingStage('Error loading data');
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedProject]);

  const combineVulnerabilityNotes = useCallback(async () => {
    try {
      setIsLoadingNotes(true);
      let combinedNotes = '';
      let combinedReproductionSteps = '';

      for (const [subdomainId, vulns] of Object.entries(vulnerabilities)) {
        const subdomain = subdomains.find(s => s.id === subdomainId);
        if (subdomain) {
          // Add subdomain section to notes
          combinedNotes += `\n## ${subdomain.name}\n\n`;
          
          // Add subdomain section to reproduction steps if we find any
          let subdomainHasReproSteps = false;
          let subdomainReproSteps = `\n## ${subdomain.name}\n\n`;
          
          for (const vuln of vulns) {
            try {
              // Fetch detailed vulnerability info
              const response = await fetch(`/api/vulnerabilities/${vuln.id}`);
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const vulnDetails = await response.json();
              
              // Add notes for this vulnerability
              if (vulnDetails && vulnDetails.notes) {
                combinedNotes += `### ${vuln.type} (${vuln.severity})\n`;
                combinedNotes += `${vulnDetails.notes}\n\n`;
              }
              
              // Add reproduction steps for this vulnerability
              if (vulnDetails && vulnDetails.recreation_steps) {
                subdomainHasReproSteps = true;
                subdomainReproSteps += `### ${vuln.type} (${vuln.severity})\n`;
                subdomainReproSteps += `${vulnDetails.recreation_steps}\n\n`;
              }
            } catch (vulnError) {
              console.error(`Error fetching vulnerability ${vuln.id}:`, vulnError);
              // Continue with other vulnerabilities even if one fails
              continue;
            }
          }
          
          // Only add reproduction steps for this subdomain if at least one vulnerability has steps
          if (subdomainHasReproSteps) {
            combinedReproductionSteps += subdomainReproSteps;
          }
        }
      }

      setFormData(prev => ({
        additionalNotes: combinedNotes.trim(),
        reproductionSteps: combinedReproductionSteps.trim() || prev.reproductionSteps
      }));
    } catch (error) {
      console.error('Error loading vulnerability notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [vulnerabilities, subdomains]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchSubdomainsAndVulnerabilities();
    }
  }, [selectedProject, fetchSubdomainsAndVulnerabilities]);

  useEffect(() => {
    if (Object.keys(vulnerabilities).length > 0) {
      combineVulnerabilityNotes();
    }
  }, [vulnerabilities, combineVulnerabilityNotes]);

  const fetchProjects = async () => {
    try {
      setLoadingStage('Fetching projects...');
      setLoadingProgress(5);
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      
      if (data.length === 1) {
        // If there's only one project, select it and start scanning immediately
        setSelectedProject(data[0].id);
        // Note: We don't need to call fetchSubdomainsAndVulnerabilities() here
        // because the useEffect hook will trigger it when selectedProject changes
      } else {
        // If there are multiple projects, just stop loading until user selects one
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setLoadingStage('Error loading projects');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);

    // Convert files to base64 Data URLs for persistence across sessions
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const target = event.target;
        if (target && target.result) {
          setPreviewUrls(prev => [...prev, target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // No need to revoke Data URLs, just remove from the array
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsLoading(true);
    setLoadingStage('Generating report...');
    setLoadingProgress(0);
    
    try {
      const project = projects.find(p => p.id === selectedProject);
      
      setLoadingProgress(20);
      setLoadingStage('Processing vulnerability data...');
      
      const reportData = {
        projectName: project?.name || '',
        vulnerabilities: Object.entries(vulnerabilities).map(([subdomainId, vulns]) => ({
          subdomain: subdomains.find(s => s.id === subdomainId)?.name || '',
          vulns: vulns.map(v => ({
            type: v.type,
            severity: v.severity,
            timestamp: new Date(v.updatedAt).toLocaleString()
          })),
          userName,
          receiverName,
          email,
        })),
        reproductionSteps: formData.reproductionSteps,
        additionalNotes: formData.additionalNotes
      };

      setLoadingProgress(40);
      setLoadingStage('Processing images...');
      
      // Store the image URLs for PDF generation
      localStorage.setItem('reportImageUrls', JSON.stringify(previewUrls));

      setLoadingProgress(50);
      setLoadingStage('Saving report data...');
      
      // Store report data for regeneration
      localStorage.setItem('reportData', JSON.stringify(reportData));
      localStorage.setItem('reportEmail', email);

      setLoadingProgress(70);
      const apiKeyAvailable = geminiApiAvailable;
      
      if (apiKeyAvailable) {
        setLoadingStage('Generating report with Gemini AI...');
      } else {
        setLoadingStage('Generating report using local template...');
      }
      
      const reportContent = await generateReport(reportData);
      
      setLoadingProgress(90);
      setLoadingStage('Finalizing report...');
      
      // Store the report content and filename in localStorage
      localStorage.setItem('generatedReport', reportContent);
      localStorage.setItem('reportFileName', `${project?.name.toLowerCase().replace(/\s+/g, '-')}-security-report.txt`);

      setLoadingProgress(100);
      setLoadingStage('Redirecting to preview...');
      
      // Redirect to the preview page
      router.push('/report-preview');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report: ' + (error instanceof Error ? error.message : 'Unknown error') + '\n\nThe application will use the fallback report generator.');
      
      try {
        // Attempt to generate a fallback report directly
        const project = projects.find(p => p.id === selectedProject);
        const reportData = {
          projectName: project?.name || '',
          vulnerabilities: Object.entries(vulnerabilities).map(([subdomainId, vulns]) => ({
            subdomain: subdomains.find(s => s.id === subdomainId)?.name || '',
            vulns: vulns.map(v => ({
              type: v.type,
              severity: v.severity,
              timestamp: new Date(v.updatedAt).toLocaleString()
            })),
            userName,
            receiverName,
            email,
          })),
          reproductionSteps: formData.reproductionSteps,
          additionalNotes: formData.additionalNotes
        };
        
        // Import the function directly to avoid the API call
        const { generateFallbackReport } = await import('@/services/reportGeneratorFallback');
        const fallbackReport = generateFallbackReport(reportData);
        
        // Store the report content and other necessary data
        localStorage.setItem('reportImageUrls', JSON.stringify(previewUrls));
        localStorage.setItem('reportData', JSON.stringify(reportData));
        localStorage.setItem('reportEmail', email);
        localStorage.setItem('generatedReport', fallbackReport);
        localStorage.setItem('reportFileName', `${project?.name.toLowerCase().replace(/\s+/g, '-')}-security-report.txt`);
        
        // Redirect to the preview page
        router.push('/report-preview');
      } catch (fallbackError) {
        console.error('Failed to generate fallback report:', fallbackError);
        alert('Could not generate report. Please try again later.');
        setIsLoading(false);
      }
    }
  };

  const GlowingLoadingAnimation = () => (
    <div className="absolute inset-0 overflow-hidden rounded-xl z-10 pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-filter backdrop-blur-sm"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/90 font-medium flex flex-col items-center">
        <div className="mb-3 relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <span className="animate-pulse">{loadingStage}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/30 via-primary to-primary/30"
          style={{ 
            width: '30%',
            filter: "drop-shadow(0 0 6px var(--color-primary))"
          }}
          animate={{
            x: ["0%", "250%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );

  const SubmitButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center space-x-3">
          <motion.div 
            className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>Generating...</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center space-x-2">
        <span>Generate Report</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </motion.button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-secondary/30 to-secondary/50 backdrop-blur-xl rounded-2xl p-8 border border-primary/20 shadow-xl"
        >
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-2">Generate Report</h1>
          <p className="text-foreground/70 mb-8">
            Create a comprehensive bug bounty report for your findings.
          </p>

          {!geminiApiAvailable && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-yellow-500 font-medium text-base mb-1">Gemini API Key Not Configured</h3>
                  <p className="text-foreground/70 text-sm">
                    The report generation feature works best with a Gemini API key. Without it, a simplified report will be generated. 
                    See the <a href="https://github.com/G381N/BugBesty#setting-up-your-gemini-api-key" target="_blank" rel="noopener noreferrer" className="text-primary underline">README</a> for setup instructions.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                  text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                  transition-all duration-300"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vulnerabilities Found with Severity */}
            {selectedProject && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 relative"
              >
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Vulnerabilities Found
                  {isLoading && (
                    <span className="ml-2 text-sm text-primary/70 animate-pulse">
                      Loading...
                    </span>
                  )}
                </h3>
                
                <div className="relative">
                  {/* Show loading animation when loading */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <GlowingLoadingAnimation />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Show vulnerabilities or placeholder */}
                  {Object.keys(vulnerabilities).length > 0 ? (
                    Object.entries(vulnerabilities).map(([subdomainId, vulns]) => {
                      const subdomain = subdomains.find(s => s.id === subdomainId);
                      return (
                        <motion.div 
                          key={subdomainId} 
                          className="p-4 bg-black/40 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-all"
                          whileHover={{ scale: 1.01 }}
                          style={{ opacity: isLoading ? 0.7 : 1 }}
                        >
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            {subdomain?.name}
                          </h4>
                          <div className="space-y-2">
                            {vulns.map(vuln => (
                              <motion.div 
                                key={vuln.id} 
                                className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                whileHover={{ x: 5 }}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    vuln.severity === 'High' 
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                      : vuln.severity === 'Medium'
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  }`}>
                                    {vuln.severity}
                                  </div>
                                  <span>{vuln.type}</span>
                                </div>
                                <span className="text-sm text-primary/70">
                                  {new Date(vuln.updatedAt).toLocaleDateString()}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="p-6 bg-black/30 rounded-xl border-2 border-primary/10 text-center">
                      {isLoading ? (
                        <p className="text-primary/60">Scanning for vulnerabilities...</p>
                      ) : (
                        <p className="text-primary/60">No vulnerabilities marked as "Found" for this project. Please check your vulnerability status in the dashboard.</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Reproduction Steps */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reproduction Steps
                {isLoadingNotes && (
                  <motion.div
                    className="ml-2 text-primary/60 text-sm flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Loading steps...</span>
                  </motion.div>
                )}
              </label>
              <div className="relative">
                <textarea
                  value={formData.reproductionSteps}
                  onChange={(e) => setFormData(prev => ({ ...prev, reproductionSteps: e.target.value }))}
                  className={`w-full h-32 px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                    text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                    transition-all duration-300 resize-none
                    ${isLoadingNotes ? 'opacity-50' : ''}`}
                  placeholder="Describe how to reproduce the vulnerabilities..."
                  disabled={isLoadingNotes}
                />
                {isLoadingNotes && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-full h-1 bg-black/20 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"
                        style={{ 
                          width: '30%',
                          filter: "drop-shadow(0 0 6px var(--color-primary))"
                        }}
                        animate={{
                          x: ["0%", "250%"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Evidence
              </label>
              <div className="p-4 border-2 border-dashed border-primary/20 rounded-xl hover:border-primary/40 transition-colors bg-black/30">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2"
                  >
                    <svg className="w-8 h-8 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                  <p className="mt-2 text-sm text-primary/70">Click to upload evidence</p>
                  <p className="text-xs text-foreground/50 mt-1">or drag and drop files here</p>
                </label>
              </div>

              {/* Preview Area */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {previewUrls.map((url, index) => (
                    <motion.div 
                      key={index} 
                      className="relative group overflow-hidden rounded-lg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Image 
                        src={url} 
                        alt={`Evidence ${index + 1}`} 
                        width={200} 
                        height={200} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Additional Notes
                {isLoadingNotes && (
                  <motion.div
                    className="ml-2 text-primary/60 text-sm flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Loading notes...</span>
                  </motion.div>
                )}
              </label>
              <div className="relative">
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className={`w-full h-32 px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                    text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                    transition-all duration-300 resize-none
                    ${isLoadingNotes ? 'opacity-50' : ''}`}
                  placeholder="Any additional information..."
                  disabled={isLoadingNotes}
                />
                {isLoadingNotes && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-full h-1 bg-black/20 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"
                        style={{ 
                          width: '30%',
                          filter: "drop-shadow(0 0 6px var(--color-primary))"
                        }}
                        animate={{
                          x: ["0%", "250%"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-black/20 p-6 rounded-xl border border-primary/10">
              <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User and Receiver Names */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary/80">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                      text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                      transition-all duration-300"
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-primary/60 mt-1">The name of the security researcher or tester who found the vulnerabilities</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary/80">Target/Receiver Name</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                      text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                      transition-all duration-300"
                    placeholder="Company Security Team"
                  />
                  <p className="text-xs text-primary/60 mt-1">The name of the person or team who will receive this report</p>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-primary/80">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-primary/20 
                    text-white focus:border-primary focus:ring-2 focus:ring-primary/20 
                    transition-all duration-300"
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-primary/60 mt-1">Your email address for contact purposes. This will be included in the report.</p>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="relative w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold
                hover:from-primary/90 hover:to-primary/70 transition-all duration-300
                disabled:opacity-70 disabled:cursor-not-allowed shadow-lg border-2 border-primary/40 hover:border-primary/60
                overflow-hidden group"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 15px var(--color-primary)" 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "100%", opacity: 0.5 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  repeatDelay: 0.5
                }}
                style={{ display: isLoading ? "none" : "block" }}
              />
              <SubmitButtonContent />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 