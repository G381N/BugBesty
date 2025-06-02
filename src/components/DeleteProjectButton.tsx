"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProjectButton({ projectId }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [taskId, setTaskId] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  
  // Clean up polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    setError("");
    
    try {
      const res = await fetch(`/api/projects/${projectId}/delete`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }
      
      // Set task ID and start polling for progress
      if (data.taskId) {
        setTaskId(data.taskId);
        
        // Start polling for task progress
        const interval = setInterval(() => {
          checkTaskProgress(data.taskId);
        }, 5000);
        
        setPollInterval(interval);
      }
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  };
  
  const checkTaskProgress = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to check task status");
      }
      
      setProgress(data.progress || 0);
      
      // If task is completed or failed, redirect to projects list
      if (data.status === "completed") {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        // Redirect to projects list
        router.push("/projects");
        router.refresh();
      } else if (data.status === "failed") {
        setError("Project deletion failed: " + (data.error || "Unknown error"));
        setIsDeleting(false);
        
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    } catch (err) {
      console.error("Error checking task progress:", err);
    }
  };
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      {isDeleting && taskId ? (
        <div className="deletion-progress">
          <h3>Deleting Project</h3>
          <p>This may take some time if the project has many subdomains.</p>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>{progress}% complete</p>
        </div>
      ) : (
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="delete-button"
        >
          {isDeleting ? "Deleting..." : "Delete Project"}
        </button>
      )}
    </div>
  );
} 