"use client";

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Modal from "@/components/common/Modal";
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EnumerationSpinner from "@/components/common/EnumerationSpinner";
import ProfileIcon from "@/components/common/ProfileIcon";

interface Project {
  id: string;
  name: string;
  targetDomain: string;
  status: string;
  owner: string;
  team?: string[];
  enumerationTaskId?: string;
  subdomainsCount?: number;
  vulnerabilitiesFound?: number;
  createdAt: string;
  updatedAt: string;
}

interface Subdomain {
  id: string;
  projectId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  totalSubdomains: number;
  vulnerabilitiesByStatus: {
    'Found': number;
    'Not Found': number;
    'Not Yet Done': number;
  };
  vulnerabilitiesBySeverity: {
    'High': number;
    'Medium': number;
    'Low': number;
  };
}

export default function Dashboard() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectMethod, setProjectMethod] = useState<'auto' | 'upload' | null>(null);
  const [targetDomain, setTargetDomain] = useState('');
  const [uploadTargetDomain, setUploadTargetDomain] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSubdomains, setProjectSubdomains] = useState<Subdomain[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalSubdomains: 0,
    vulnerabilitiesByStatus: { 'Found': 0, 'Not Found': 0, 'Not Yet Done': 0 },
    vulnerabilitiesBySeverity: { 'High': 0, 'Medium': 0, 'Low': 0 }
  });
  const [uploadedSubdomains, setUploadedSubdomains] = useState<string[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [subdomainsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSubdomains, setSelectedSubdomains] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [firebaseAuthSynced, setFirebaseAuthSynced] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Synchronize Firebase Auth with NextAuth
    const syncFirebaseAuth = async () => {
      try {
        console.log('Attempting to sync Firebase authentication with NextAuth session:', session);
        
        const { auth } = await import('@/lib/firebase');
        const { signInWithCustomToken } = await import('firebase/auth');
        
        // Check if we're already signed in
        if (auth.currentUser) {
          console.log('Already signed in with Firebase as:', auth.currentUser.uid);
          setFirebaseAuthSynced(true);
          return;
        }
        
        console.log('Fetching custom token from /api/auth/sync-firebase endpoint');
        const response = await fetch('/api/auth/sync-firebase');
        const responseData = await response.text();
        console.log('Raw response data:', responseData);
        
        if (!response.ok) {
          console.error('Failed to get custom token:', response.status, responseData);
          return;
        }
        
        let data;
        try {
          data = JSON.parse(responseData);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          return;
        }
        
        console.log('Response data:', data);
        
        if (data.token) {
          console.log('Received custom token of length:', data.token.length);
          try {
            console.log('Signing in with custom token...');
            const userCredential = await signInWithCustomToken(auth, data.token);
            console.log('Successfully signed in with Firebase using custom token, user:', userCredential.user.uid);
            setFirebaseAuthSynced(true);
          } catch (error) {
            console.error('Error signing in with custom token:', error);
          }
        } else {
          console.error('No token received from sync endpoint');
        }
      } catch (error) {
        console.error('Failed to sync Firebase Auth:', error);
      }
    };
    
    if (session?.user) {
      syncFirebaseAuth();
    }

    // Set up listener for Firebase auth state changes
    const setupAuthListener = async () => {
      const { auth } = await import('@/lib/firebase');
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('Firebase auth state changed: signed in as', user.uid);
          setFirebaseAuthSynced(true);
        } else {
          console.log('Firebase auth state changed: signed out');
          setFirebaseAuthSynced(false);
          // If signed out but we have a session, try to re-sync
          if (session?.user) {
            console.log('Re-syncing Firebase auth after sign out detected');
            syncFirebaseAuth();
          }
        }
      });
      
      // Clean up listener on unmount
      return () => unsubscribe();
    };
    
    setupAuthListener();
  }, [session]);

  useEffect(() => {
    if (firebaseAuthSynced) {
      console.log('Firebase auth synced, fetching projects...');
    fetchProjects();
    }
  }, [firebaseAuthSynced]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.error || errorData.details || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Projects fetched successfully:', data);
      setProjects(data);
      
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Don't set projects to empty array on error to maintain previous state
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectData = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/subdomains`);
      const subdomains = await response.json();
      setProjectSubdomains(subdomains);

      // Fetch vulnerability stats
      const statsResponse = await fetch(`/api/projects/${projectId}/stats`);
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (project: Project) => {
    setIsProjectSwitching(true);
    try {
      setSelectedProject(project);
      await fetchProjectData(project.id);
    } finally {
      setIsProjectSwitching(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(`Are you sure you want to delete this project?`)) {
      return;
    }

    setIsDeletingProject(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      // Remove the project from the projects state immediately
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      console.log(`Successfully deleted project: ${projectId}`);
      
      // Clear the selected project if it was deleted
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }

      // Force refresh the page to ensure all UI elements update
      window.location.reload();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeletingProject(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadTargetDomain) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const subdomains = text.split('\n').filter(line => line.trim());
        setUploadedSubdomains(subdomains);
      };
      reader.readAsText(file);
    }
  };

  const handleCreateProject = async () => {
    if (!uploadedSubdomains || !uploadTargetDomain) {
      alert('Please upload a file and enter a domain name first');
      return;
    }

    setIsCreatingProject(true);

    try {
      console.log('Creating project with manual subdomains:', uploadTargetDomain);
      
      const response = await fetch('/api/projects/create-with-subdomains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: uploadTargetDomain,
          subdomains: uploadedSubdomains,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from create project API:', errorData);
        throw new Error(errorData.details || errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Project created successfully:', data);
      
      setIsNewProjectModalOpen(false);
      setProjectMethod(null);
      setUploadTargetDomain('');
      setUploadedSubdomains(null);
      
      // Refresh the projects list
      await fetchProjects();
      
      // Automatically switch to the newly created project
      if (data.project && data.project.id) {
        handleProjectSelect(data.project);
        router.push(`/dashboard?project=${data.project.id}`);
      } else {
        // Force refresh the page to ensure sidebar updates
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && uploadTargetDomain) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const subdomains = text.split('\n').filter(line => line.trim());
        
        try {
          const response = await fetch('/api/projects/create-with-subdomains', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: uploadTargetDomain,
              subdomains: subdomains,
            }),
          });

          const data = await response.json();
          
          if (response.ok) {
            setIsNewProjectModalOpen(false);
            setProjectMethod(null);
            setUploadTargetDomain('');
            fetchProjects();
            
            // Automatically switch to the newly created project
            if (data.project && data.project.id) {
              handleProjectSelect(data.project);
              router.push(`/dashboard?project=${data.project.id}`);
            } else {
              // Force refresh the page to ensure sidebar updates
              window.location.reload();
            }
          } else {
            throw new Error(data.details || data.error || 'Failed to create project');
          }
        } catch (error: any) {
          console.error('Error creating project:', error);
          alert(error.message || 'Failed to create project. Please try again.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteSubdomain = async (subdomainId: string) => {
    if (!confirm('Are you sure you want to delete this subdomain? This will delete all associated vulnerability data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/subdomains/${subdomainId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove subdomain from state
        setProjectSubdomains(prevSubdomains => 
          prevSubdomains.filter(s => s.id !== subdomainId)
        );
        
        // Refresh stats
        if (selectedProject) {
          fetchProjectData(selectedProject.id);
        }
      } else {
        throw new Error('Failed to delete subdomain');
      }
    } catch (error) {
      console.error('Error deleting subdomain:', error);
      alert('Failed to delete subdomain');
    }
  };

  const indexOfLastSubdomain = currentPage * subdomainsPerPage;
  const indexOfFirstSubdomain = indexOfLastSubdomain - subdomainsPerPage;
  const currentSubdomains = projectSubdomains
    .filter(subdomain => 
      searchQuery ? subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .slice(indexOfFirstSubdomain, indexOfLastSubdomain);
  
  const totalPages = Math.ceil(
    projectSubdomains.filter(subdomain => 
      searchQuery ? subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    ).length / subdomainsPerPage
  );

  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6 mb-8">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === 1
              ? 'text-foreground/30 cursor-not-allowed'
              : 'hover:bg-primary/10 text-foreground'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-10 h-10 rounded-lg transition-all duration-200 
                ${currentPage === 1 ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
            >
              1
            </button>
            {startPage > 2 && (
              <span className="text-foreground/50 px-2">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={`w-10 h-10 rounded-lg transition-all duration-200 ${
              currentPage === number
                ? 'bg-primary text-white'
                : 'hover:bg-primary/10'
            }`}
          >
            {number}
          </button>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-foreground/50 px-2">...</span>
            )}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`w-10 h-10 rounded-lg transition-all duration-200 
                ${currentPage === totalPages ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === totalPages
              ? 'text-foreground/30 cursor-not-allowed'
              : 'hover:bg-primary/10 text-foreground'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  const handleAutoEnumeration = async () => {
    if (!targetDomain) {
      return;
    }

    setIsCreatingProject(true);

    try {
      console.log('Starting enumeration for domain:', targetDomain);
      
      const response = await fetch('/api/enumeration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: targetDomain
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from enumeration API:', errorData);
        throw new Error(errorData.details || errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Enumeration completed successfully:', data);
      
      setIsNewProjectModalOpen(false);
      setProjectMethod(null);
      setTargetDomain('');
      await fetchProjects();
      
      // Refresh the page to ensure data is properly loaded
      window.location.reload();
    } catch (error: any) {
      console.error('Error during enumeration:', error);
      alert(`Enumeration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteSelectedSubdomains = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedSubdomains.size} selected subdomains? This will delete all associated vulnerability data.`)) {
      return;
    }

    try {
      // Delete each selected subdomain
      for (const subdomainId of selectedSubdomains) {
        await fetch(`/api/subdomains/${subdomainId}`, {
          method: 'DELETE'
        });
      }

      // Update state after successful deletion
      setProjectSubdomains(prevSubdomains => 
        prevSubdomains.filter(s => !selectedSubdomains.has(s.id))
      );
      
      // Reset selection state
      setSelectedSubdomains(new Set());
      setIsSelectionMode(false);

      // Refresh project data
      if (selectedProject) {
        fetchProjectData(selectedProject.id);
      }
    } catch (error) {
      console.error('Error deleting subdomains:', error);
      alert('Failed to delete some subdomains');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedSubdomains(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedSubdomains.size === currentSubdomains.length) {
      setSelectedSubdomains(new Set());
    } else {
      setSelectedSubdomains(new Set(currentSubdomains.map(s => s.id)));
    }
  };

  return (
    <DashboardLayout
      projects={projects}
      selectedProject={selectedProject}
      onProjectSelect={handleProjectSelect}
      onNewProject={() => setIsNewProjectModalOpen(true)}
      isDeletingProject={isDeletingProject}
      onDeleteProject={handleDeleteProject}
      sidebarWidth="256px"
    >
      {isProjectSwitching && <LoadingSpinner />}

      {/* Header with Profile Icon */}
      <div 
        ref={stickyHeaderRef} 
        className="border-b border-white/10 bg-background sticky top-0 z-50"
      >
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium">
              {isLoading ? 'Loading...' : (selectedProject ? selectedProject.name : 'BugBesty')}
            </h1>
            
            {/* Profile Icon */}
            <ProfileIcon size="sm" showName={false} />
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
            <LoadingSpinner />
          </div>
        ) : (
          <>
        {!selectedProject ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Welcome to BugBesty!</h2>
            <p className="text-foreground/70 mb-8">
              Start your bug bounty journey by creating your first project.
            </p>
            <button 
              className="btn-primary"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <>
                {/* Analytics Section with Toggle */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Analytics</h2>
                    <button 
                      onClick={() => setShowAnalytics(prev => !prev)}
                      className="px-4 py-2 bg-gradient-to-r from-black/80 to-black/60 rounded-lg border border-primary/30 text-sm hover:border-primary/50 transition-all duration-200 flex items-center gap-2"
                    >
                      {showAnalytics ? (
                        <>
                          <span>Hide Analytics</span>
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Show Analytics</span>
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>

                  {showAnalytics && (
                    <>
                      {/* Main Stats Cards */}
                      <div className="grid grid-cols-3 gap-6 mb-8">
                        {/* Total Subdomains Card */}
                        <div className="bg-gradient-to-br from-black/70 to-black/40 rounded-xl p-6 border border-white/5 shadow-lg">
                          <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground/70">Total Subdomains</h3>
                              <p className="text-4xl font-bold mt-2">{stats.totalSubdomains}</p>
                  </div>
                            <div className="flex items-end">
                              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

                        {/* Vulnerabilities Found Card */}
                        <div className="bg-gradient-to-br from-black/70 to-black/40 rounded-xl p-6 border border-white/5 shadow-lg">
                          <div className="flex items-center justify-between">
                  <div>
                              <h3 className="text-sm font-medium text-foreground/70">Vulnerabilities Found</h3>
                              <p className="text-4xl font-bold mt-2">{stats.vulnerabilitiesByStatus['Found']}</p>
                  </div>
                            <div className="flex items-end">
                              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Vulnerabilities Card */}
                        <div className="bg-gradient-to-br from-black/70 to-black/40 rounded-xl p-6 border border-white/5 shadow-lg">
                          <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-foreground/70">Vulnerabilities</h3>
                            <p className="text-4xl font-bold mt-2">{stats.vulnerabilitiesByStatus['Found']}</p>
                            <div className="flex items-center justify-between mt-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>Not Found: {stats.vulnerabilitiesByStatus['Not Found']}</span>
                  </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                <span>Pending: {stats.vulnerabilitiesByStatus['Not Yet Done']}</span>
                  </div>
                </div>
                    </div>
                    </div>
                  </div>

                      {/* Vulnerability Severity - Only showing "Found" vulnerabilities */}
                      <div className="bg-gradient-to-br from-black/70 to-black/40 rounded-xl p-6 border border-white/5 shadow-lg mb-8">
                        <h3 className="text-sm font-medium text-foreground/70 mb-4">Vulnerability Severity (Found Only)</h3>
                        <p className="text-xs text-foreground/60 mb-4">Each subdomain can have up to 50 vulnerabilities. Only counting vulnerabilities marked as "Found".</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-3 h-3 rounded-full bg-red-500"></span>
                              <span className="font-medium">High</span>
                    </div>
                            <div className="flex items-center">
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ 
                                  width: `${stats.vulnerabilitiesBySeverity['High'] > 0
                                    ? (stats.vulnerabilitiesBySeverity['High'] / 
                                      (stats.vulnerabilitiesBySeverity['High'] + 
                                       stats.vulnerabilitiesBySeverity['Medium'] + 
                                       stats.vulnerabilitiesBySeverity['Low'] || 1)) * 100 
                                    : 0}%` 
                                }}></div>
                  </div>
                              <span className="ml-2 font-medium text-sm">{stats.vulnerabilitiesBySeverity['High'] || 0}</span>
                </div>
                            <div className="mt-2 text-xs text-foreground/60">
                              Out of 50 possible vulnerabilities
              </div>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                              <span className="font-medium">Medium</span>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ 
                                  width: `${stats.vulnerabilitiesBySeverity['Medium'] > 0
                                    ? (stats.vulnerabilitiesBySeverity['Medium'] / 
                                      (stats.vulnerabilitiesBySeverity['High'] + 
                                       stats.vulnerabilitiesBySeverity['Medium'] + 
                                       stats.vulnerabilitiesBySeverity['Low'] || 1)) * 100 
                                    : 0}%` 
                                }}></div>
                              </div>
                              <span className="ml-2 font-medium text-sm">{stats.vulnerabilitiesBySeverity['Medium'] || 0}</span>
                            </div>
                            <div className="mt-2 text-xs text-foreground/60">
                              Out of 50 possible vulnerabilities
                            </div>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              <span className="font-medium">Low</span>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ 
                                  width: `${stats.vulnerabilitiesBySeverity['Low'] > 0
                                    ? (stats.vulnerabilitiesBySeverity['Low'] / 
                                      (stats.vulnerabilitiesBySeverity['High'] + 
                                       stats.vulnerabilitiesBySeverity['Medium'] + 
                                       stats.vulnerabilitiesBySeverity['Low'] || 1)) * 100 
                                    : 0}%` 
                                }}></div>
                              </div>
                              <span className="ml-2 font-medium text-sm">{stats.vulnerabilitiesBySeverity['Low'] || 0}</span>
                            </div>
                            <div className="mt-2 text-xs text-foreground/60">
                              Out of 50 possible vulnerabilities
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
            </div>

            <div className="bg-secondary/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Subdomains</h2>
              
              {/* Add search bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search subdomains..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                      placeholder-white/40 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-end gap-4 px-6">
                  {isSelectionMode ? (
                    <>
                      <button
                        onClick={toggleSelectAll}
                        className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                          transition-all duration-200"
                      >
                        {selectedSubdomains.size === currentSubdomains.length ? 'Deselect All' : 'Select All'}
                      </button>
                      {selectedSubdomains.size > 0 && (
                        <button
                          onClick={handleDeleteSelectedSubdomains}
                          className="text-[15px] font-medium text-red-400 hover:text-red-300 
                            transition-all duration-200 flex items-center gap-2"
                        >
                          Delete ({selectedSubdomains.size})
                        </button>
                      )}
                      <button
                        onClick={toggleSelectionMode}
                        className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                          transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleSelectionMode}
                      className="text-[15px] font-medium text-foreground/70 hover:text-foreground 
                        transition-all duration-200"
                    >
                      Select
                    </button>
                  )}
                </div>

                {/* Show "No results" message when search has no matches */}
                {currentSubdomains.length === 0 && searchQuery && (
                  <div className="text-center py-10 text-white/60">
                    <p>No subdomains found matching "{searchQuery}"</p>
                  </div>
                )}

                {/* Subdomains List */}
                {currentSubdomains.map((subdomain) => (
                  <div
                    key={subdomain.id}
                    className="flex items-center justify-between px-6 py-4 bg-black/20 
                      hover:bg-black/30 transition-colors rounded-lg group"
                  >
                    <div className="flex items-center gap-4">
                      {isSelectionMode && (
                        <div 
                          onClick={() => {
                            const newSelected = new Set(selectedSubdomains);
                            if (newSelected.has(subdomain.id)) {
                              newSelected.delete(subdomain.id);
                            } else {
                              newSelected.add(subdomain.id);
                            }
                            setSelectedSubdomains(newSelected);
                          }}
                          className={`w-5 h-5 rounded border transition-all duration-200 cursor-pointer
                            flex items-center justify-center
                            ${selectedSubdomains.has(subdomain.id)
                              ? 'bg-primary border-primary'
                              : 'border-white/20 hover:border-white/40'
                            }`}
                        >
                          {selectedSubdomains.has(subdomain.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="text-foreground/90">{subdomain.name}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">
                        {subdomain.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/${subdomain.id}`)}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {projectSubdomains.filter(subdomain => 
                searchQuery ? subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
              ).length > subdomainsPerPage && <Pagination />}
              
              <div className="mt-4 text-sm text-foreground/70">
                Showing {indexOfFirstSubdomain + 1}-{Math.min(indexOfLastSubdomain, projectSubdomains.filter(subdomain => 
                  searchQuery ? subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
                ).length)} of {projectSubdomains.filter(subdomain => 
                  searchQuery ? subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
                ).length} subdomains
              </div>
            </div>
          </>
        )}

        <Modal isOpen={isNewProjectModalOpen} onClose={() => {
          setIsNewProjectModalOpen(false);
          setProjectMethod(null);
          setUploadTargetDomain('');
          setUploadedSubdomains(null);
        }}>
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">Create New Project</h2>
              <p className="text-foreground/70">Choose how you want to start your project</p>
            </div>
            
            {!projectMethod ? (
              <div className="grid grid-cols-1 gap-6">
                <button
                  onClick={() => setProjectMethod('auto')}
                  className="group p-6 border border-white/10 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 8a4 4 0 100-8 4 4 0 000 8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold mb-1">Auto Enumeration</h3>
                      <p className="text-sm text-foreground/70">
                        Automatically discover subdomains for your target
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setProjectMethod('upload')}
                  className="group p-6 border border-white/10 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold mb-1">Upload Subdomains</h3>
                      <p className="text-sm text-foreground/70">
                        Upload a text file containing your subdomains
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : projectMethod === 'auto' ? (
              <div className="space-y-6">
                <button
                  onClick={() => setProjectMethod(null)}
                  className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to methods
                </button>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Domain</label>
                    <input
                      type="text"
                      value={targetDomain}
                      onChange={(e) => setTargetDomain(e.target.value)}
                      placeholder="example.com"
                      className="w-full p-3 rounded-lg bg-background border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAutoEnumeration}
                    disabled={isCreatingProject || !targetDomain}
                    className={`w-full p-3 rounded-lg text-white transition-all duration-200 flex items-center justify-center space-x-2
                      ${isCreatingProject || !targetDomain 
                        ? 'bg-primary/50 cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary/90'}`}
                  >
                    {isCreatingProject ? (
                      <span>Starting Enumeration...</span>
                    ) : (
                      'Start Enumeration'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={() => setProjectMethod(null)}
                  className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to methods
                </button>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter target domain"
                    value={uploadTargetDomain}
                    onChange={(e) => setUploadTargetDomain(e.target.value)}
                    className="w-full p-3 rounded-lg bg-background border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                  />
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-foreground/70 group-hover:text-foreground transition-colors">
                        Drag & drop a file or click to browse
                      </p>
                    </label>
                    {uploadedSubdomains && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg inline-block">
                        <p className="text-sm text-primary">
                          {uploadedSubdomains.length} subdomains loaded
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreateProject}
                    disabled={!uploadedSubdomains || !uploadTargetDomain || isCreatingProject}
                    className={`w-full p-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                      uploadedSubdomains && uploadTargetDomain && !isCreatingProject
                        ? 'bg-primary text-white hover:bg-primary/90 transform hover:scale-[1.02]'
                        : 'bg-primary/50 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {isCreatingProject ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Creating Project...</span>
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {isCreatingProject && <EnumerationSpinner domain={targetDomain} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 