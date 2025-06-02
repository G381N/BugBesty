"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewProject() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [enumerationMethod, setEnumerationMethod] = useState("auto");
  
  // New states for task tracking
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const createProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          targetDomain,
          enumerationMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      if (enumerationMethod === "auto" && data.project.enumerationTaskId) {
        // Set task ID and start polling for progress
        setTaskId(data.project.enumerationTaskId);
        
        // Start polling for task progress
        const interval = setInterval(() => {
          checkTaskProgress(data.project.enumerationTaskId, data.project.id);
        }, 5000);
        
        setPollInterval(interval);
      } else {
        // For manual enumeration, redirect immediately to dashboard with project selected
        router.push(`/dashboard?project=${data.project.id}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  const checkTaskProgress = async (taskId: string, projectId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to check task status");
      }
      
      setTaskProgress(data.progress || 0);
      
      // If task is completed or failed, redirect to project
      if (data.status === "completed" || data.status === "failed") {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        // Redirect to project page
        router.push(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error("Error checking task progress:", error instanceof Error ? error.message : String(error));
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return <div>Redirecting to login...</div>;
  }

  return (
    <div>
      <h1>Create New Project</h1>
      
      {/* Show task progress bar if enumeration is in progress */}
      {taskId && (
        <div className="progress-container">
          <h3>Subdomain Enumeration in Progress</h3>
          <p>This may take several minutes to complete. You'll be redirected when it's done.</p>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${taskProgress}%` }}
            ></div>
          </div>
          <p>{taskProgress}% complete</p>
        </div>
      )}
      
      {/* Only show the form if no task is in progress */}
      {!taskId && (
        <form onSubmit={createProject}>
          {error && <div className="error">{error}</div>}
          
          <div>
            <label htmlFor="name">Project Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="targetDomain">Target Domain</label>
            <input
              id="targetDomain"
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="example.com"
              required
            />
          </div>
          
          <div>
            <label>Enumeration Method</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="enumerationMethod"
                  value="auto"
                  checked={enumerationMethod === "auto"}
                  onChange={() => setEnumerationMethod("auto")}
                />
                Automatic (uses multiple sources to discover subdomains)
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="enumerationMethod"
                  value="manual"
                  checked={enumerationMethod === "manual"}
                  onChange={() => setEnumerationMethod("manual")}
                />
                Manual (upload your own subdomain list)
              </label>
            </div>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      )}
    </div>
  );
} 