"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Project } from '@/types/Project';

interface DashboardLayoutProps {
  children: React.ReactNode;
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  isDeletingProject: string | null;
  onDeleteProject: (projectId: string) => Promise<void>;
  sidebarWidth?: string;
}

export default function DashboardLayout({
  children,
  projects,
  selectedProject,
  onProjectSelect,
  onNewProject,
  isDeletingProject,
  onDeleteProject,
  sidebarWidth = "256px"
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentSidebarWidth = isSidebarCollapsed ? "64px" : sidebarWidth;

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      onProjectSelect(project);
    }
  };
  
  return (
    <div className="bg-background text-foreground">
      <Sidebar 
        onCollapsedChange={setIsSidebarCollapsed}
        onNewProject={onNewProject}
        onProjectSelect={handleProjectSelect}
        activeProjectId={selectedProject?.id || null}
        isDeletingProject={isDeletingProject}
        onDeleteProject={onDeleteProject}
        sidebarWidth={sidebarWidth}
        collapsedWidth={currentSidebarWidth}
      />
      <main 
        style={{ 
          marginLeft: currentSidebarWidth,
        }}
        className="fixed inset-0 overflow-y-auto z-20 transition-[margin-left] duration-300 ease-in-out will-change-[margin-left]"
      >
        {children}
      </main>
    </div>
  );
} 