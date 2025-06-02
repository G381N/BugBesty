"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnumerationSpinnerProps {
  domain?: string;
}

export default function EnumerationSpinner({ domain = "Target Domain" }: EnumerationSpinnerProps) {
  const [progress, setProgress] = useState(0);
  const [discoveredSubdomains, setDiscoveredSubdomains] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("Initializing scan");
  
  // Simulated enumeration progress for visual effect
  useEffect(() => {
    // Faster progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = Math.random() * 5; // Increased increment between 0-5%
        return Math.min(prev + increment, 100);
      });
    }, 500); // Reduced interval to 500ms

    // Faster stage transitions
    const stages = [
      "Initializing scan",
      "Scanning certificate transparency logs",
      "Analyzing DNS records",
      "Running passive reconnaissance",
      "Checking common subdomains",
      "Verifying discovered targets",
      "Finalizing results"
    ];
    
    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        stageIndex++;
        setCurrentStage(stages[stageIndex]);
      } else {
        clearInterval(stageInterval);
      }
    }, 2000); // Reduced interval to 2 seconds

    // Faster subdomain discovery
    const commonSubdomains = [
      "admin", "api", "app", "dev", "mail", "test", "staging", "beta", 
      "internal", "vpn", "secure", "login", "portal", "remote", "intranet",
      "jenkins", "jira", "confluence", "git", "gitlab", "server", "db", 
      "dashboard", "analytics", "store", "payment", "cdn", "media", "static"
    ];
    
    const discoveryInterval = setInterval(() => {
      if (Math.random() > 0.4) { // Increased chance to discover a subdomain
        const randomSubdomain = commonSubdomains[Math.floor(Math.random() * commonSubdomains.length)];
        const fullSubdomain = `${randomSubdomain}.${domain}`;
        
        setDiscoveredSubdomains(prev => {
          if (!prev.includes(fullSubdomain)) {
            const newList = [...prev, fullSubdomain];
            if (newList.length > 5) {
              return newList.slice(newList.length - 5);
            }
            return newList;
          }
          return prev;
        });
      }
    }, 1000); // Reduced interval to 1 second

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
      clearInterval(discoveryInterval);
    };
  }, [domain]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <style jsx>{`
        @keyframes radar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-radar {
          animation: radar 2s linear infinite;
        }
      `}</style>
      <div className="max-w-2xl w-full bg-secondary/50 border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Left side - Scanning Animation */}
          <div className="relative w-48 h-48 flex-shrink-0">
            {/* Progress circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-primary/10"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary"
                strokeWidth="6"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
              />
            </svg>
            
            {/* Percentage in the middle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(progress)}%
              </div>
            </div>
            
            {/* Pulse effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full absolute rounded-full bg-primary/5 animate-ping opacity-30"></div>
            </div>
            
            {/* Radar sweep effect */}
            <div className="absolute inset-0 origin-center">
              <div className="h-full w-1/2 origin-right bg-gradient-to-r from-primary/40 to-transparent animate-radar"></div>
            </div>
          </div>
          
          {/* Right side - Info and Discovered Subdomains */}
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-xl font-medium text-primary mb-2">
                Scanning {domain}
              </h3>
              <p className="text-foreground/70">
                {currentStage}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Live Subdomain Discovery */}
            <div className="bg-background/50 rounded-lg p-4 border border-white/5 h-[140px] overflow-hidden">
              <h4 className="text-sm font-medium text-foreground/70 mb-2">
                Discovered Subdomains {discoveredSubdomains.length > 0 && `(${discoveredSubdomains.length})`}
              </h4>
              <div className="relative h-[104px] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {discoveredSubdomains.length > 0 ? (
                    discoveredSubdomains.map((subdomain, index) => (
                      <motion.div
                        key={`${subdomain}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 py-1 text-sm"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="font-mono">{subdomain}</span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-foreground/50 italic text-sm">
                      Waiting for subdomains...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 