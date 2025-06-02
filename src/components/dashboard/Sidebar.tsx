"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from 'next/navigation';
import { Project } from '@/types/Project';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewProject?: () => void;
  onProjectSelect?: (projectId: string) => void;
  activeProjectId: string | null;
  isDeletingProject: string | null;
  onDeleteProject: (projectId: string) => void;
  sidebarWidth?: string;
  collapsedWidth?: string;
}

export default function Sidebar({ 
  onCollapsedChange, 
  onNewProject, 
  onProjectSelect, 
  activeProjectId, 
  isDeletingProject, 
  onDeleteProject,
  sidebarWidth = "256px",
  collapsedWidth = "64px"
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [switchingProject, setSwitchingProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousActiveId = useRef(activeProjectId);
  const router = useRouter();
  const pathname = usePathname();
  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProjects();
    
    // Set up polling for real-time updates with longer interval
    fetchInterval.current = setInterval(fetchProjects, 60000); // Update every 60 seconds
    
    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeProjectId !== previousActiveId.current) {
      setSwitchingProject(null);
      previousActiveId.current = activeProjectId;
    }
  }, [activeProjectId]);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  const handleProjectClick = async (projectId: string) => {
    if (projectId === activeProjectId) return;
    
    setSwitchingProject(projectId);
    
    try {
      if (onProjectSelect) {
        await onProjectSelect(projectId);
      }
    } catch (error) {
      setSwitchingProject(null);
      console.error('Failed to switch project:', error);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    router.push(`/dashboard/${projectId}`);
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will delete all associated subdomains and vulnerability data.')) {
      return;
    }
    
    // Immediately update UI to remove the project
    setProjects(currentProjects => currentProjects.filter(p => p.id !== projectId));
    
    try {
      // Trigger deletion in the background
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Handle navigation if project was active
        if (projectId === activeProjectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId);
          if (remainingProjects.length > 0) {
            router.push(`/dashboard?project=${remainingProjects[0].id}`);
          } else {
            router.push('/dashboard');
          }
        }
        
        // Refresh the projects list
        await fetchProjects();
      } else {
        // If deletion fails, refresh the projects list to restore the UI
        await fetchProjects();
        console.error('Failed to delete project:', await response.text());
      }
    } catch (error) {
      // If an error occurs, refresh the projects list to restore the UI
      await fetchProjects();
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <div
      style={{ 
        width: isCollapsed ? collapsedWidth : sidebarWidth 
      }}
      className="bg-secondary/50 h-screen fixed left-0 top-0 z-30 transition-all duration-300 border-r border-white/10 backdrop-blur-sm"
    >
      <div className="flex flex-col h-full">
        {/* Logo Section - Add border bottom */}
        <div className="px-4 flex items-center justify-between border-b border-white/10 bg-secondary/80">
          {!isCollapsed && (
            <span className="text-xl font-bold gradient-text py-3">BugBesty</span>
          )}
          <button
            onClick={() => handleCollapse(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              className={`w-6 h-6 text-foreground transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isCollapsed
                    ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                    : "M11 19l-7-7 7-7M19 19l-7-7 7-7"
                }
              />
            </svg>
          </button>
        </div>

        {/* Projects Section - Add subtle background */}
        <div className="flex-1 overflow-y-auto p-4 bg-secondary/30">
          <div className="flex items-center justify-between mb-4">
            {!isCollapsed && (
              <h2 className="text-sm font-semibold text-foreground/70">Projects</h2>
            )}
            <button
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/70 hover:text-foreground"
              onClick={onNewProject}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Project List - Improve spacing and hover states */}
          {!isCollapsed && (
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-4 text-foreground/50">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer
                      transition-all duration-200
                      ${project.id === activeProjectId 
                        ? 'bg-primary/20 text-primary border border-primary/20' 
                        : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                      }`}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {isDeletingProject === project.id ? (
                        <div className="w-2 h-2">
                          <div className="w-2 h-2 rounded-full border border-red-500/60 border-t-transparent animate-spin" />
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-primary/60" />
                      )}
                      <span className={`truncate transition-opacity duration-300 
                        ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        {project.name}
                      </span>
                    </div>
                    
                    {!isCollapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        disabled={isDeletingProject === project.id}
                        className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all
                          ${isDeletingProject === project.id ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Actions - Updated */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <div className="space-y-2">
            {/* Phishing Link Check */}
            <button
              onClick={() => router.push('/phishing-check')}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {!isCollapsed && <span>Phishing Link Check</span>}
            </button>

            {/* Training Module */}
            <button
              onClick={() => router.push('/training-module')}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {!isCollapsed && <span>Training Module</span>}
            </button>
          </div>
        </div>

        {/* Report Generation */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => router.push('/report-generation')}
            className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
            </svg>
            {!isCollapsed && <span>Generate Report</span>}
          </button>
        </div>

        {/* Optional: Add a subtle gradient overlay at the bottom */}
        <div className="h-12 bg-gradient-to-t from-secondary/50 to-transparent pointer-events-none absolute bottom-0 left-0 right-0" />
      </div>
    </div>
  );
} 