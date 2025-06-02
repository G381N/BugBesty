import { NextResponse } from "next/server";
import { updateTask, getTask, TASK_STATUS, updateTaskProgress } from "@/lib/backgroundTasks";
import { db } from "@/lib/firebase";
import { ProjectModel } from "@/models/Project";
import { SubdomainModel } from "@/models/Subdomain";
import { enumerateSubdomains } from "@/lib/enumeration";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";

// This endpoint is called by a cron job to process tasks
export async function POST(req: Request) {
  try {
    const headers = Object.fromEntries(req.headers.entries());
    const authorization = headers.authorization;
    const token = process.env.CRON_SECRET;
    
    // Verify the request is authorized
    if (authorization !== `Bearer ${token}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    
    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    if (task.status !== TASK_STATUS.PENDING && task.status !== TASK_STATUS.PROCESSING) {
      return NextResponse.json({ 
        error: `Task is ${task.status}, cannot process` 
      }, { status: 400 });
    }
    
    // Mark as processing
    await updateTask(taskId, TASK_STATUS.PROCESSING);
    
    // Process based on task type
    if (task.type === "subdomain_enumeration") {
      // Get project details
      const projectQuery = query(
        collection(db, "projects"),
        where("id", "==", task.data.projectId)
      );
      const projectSnapshot = await getDocs(projectQuery);
      
      if (projectSnapshot.empty) {
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: "Project not found"
        });
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      
      const projectDoc = projectSnapshot.docs[0];
      const project = projectDoc.data() as any;
      
      // Process enumeration in chunks
      const targetDomain = task.data.targetDomain;
      const chunkSize = 50; // Process 50 subdomains at a time
      const totalApis = 15; // Total number of enumeration APIs
      
      try {
        // Retrieve existing progress if available
        let progress = task.progress || 0;
        let processedApis = Math.floor(progress * totalApis / 100);
        let allSubdomains = task.result?.subdomains || [];
        
        // Start enumeration from the last processed API
        const { subdomains, completedApis } = await enumerateSubdomains(
          targetDomain, 
          processedApis, 
          chunkSize
        );
        
        // Combine with existing results and deduplicate
        allSubdomains = [...new Set([...allSubdomains, ...subdomains])];
        
        // Calculate new progress
        const newProgress = Math.min(100, Math.floor((completedApis / totalApis) * 100));
        
        // Store partial results
        await updateTaskProgress(taskId, newProgress, {
          subdomains: allSubdomains,
          completedApis
        });
        
        // If completed all APIs, save results to database
        if (completedApis >= totalApis) {
          // Save subdomains to database
          const subdomainDocs = await Promise.all(
            allSubdomains.map(async (hostname: string) => {
              // Check if subdomain already exists
              const subdomainQuery = query(
                collection(db, "subdomains"),
                where("hostname", "==", hostname),
                where("projectId", "==", project.id)
              );
              const subdomainSnapshot = await getDocs(subdomainQuery);
              
              if (subdomainSnapshot.empty) {
                // Create new subdomain
                const newSubdomain = {
                  id: crypto.randomUUID(),
                  hostname,
                  projectId: project.id,
                  discoveryMethod: "auto_enumeration",
                  status: "active",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                await addDoc(collection(db, "subdomains"), newSubdomain);
                return newSubdomain;
              } else {
                // Update existing subdomain
                const subdomainDoc = subdomainSnapshot.docs[0];
                const subdomain = subdomainDoc.data();
                const updatedSubdomain = {
                  ...subdomain,
                  updatedAt: new Date().toISOString()
                };
                await updateDoc(doc(db, "subdomains", subdomainDoc.id), updatedSubdomain);
                return updatedSubdomain;
              }
            })
          );
          
          // Update project status
          await updateDoc(doc(db, "projects", projectDoc.id), {
            status: "active",
            subdomainsCount: allSubdomains.length,
            updatedAt: new Date().toISOString()
          });
          
          // Mark task as completed
          await updateTask(taskId, TASK_STATUS.COMPLETED, {
            result: {
              subdomains: allSubdomains,
              count: allSubdomains.length
            }
          });
          
          return NextResponse.json({
            success: true,
            message: "Enumeration completed",
            subdomainsCount: allSubdomains.length
          });
        }
        
        // Return partial progress
        return NextResponse.json({
          success: true,
          message: "Partial enumeration processed",
          progress: newProgress,
          subdomainsCount: allSubdomains.length
        });
        
      } catch (error: any) {
        console.error("Enumeration error:", error);
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: error.message || "Unknown error"
        });
        return NextResponse.json({ 
          error: "Enumeration failed", 
          details: error.message || "Unknown error" 
        }, { status: 500 });
      }
    } else if (task.type === "project_deletion") {
      // Get project details
      const projectQuery = query(
        collection(db, "projects"),
        where("id", "==", task.data.projectId)
      );
      const projectSnapshot = await getDocs(projectQuery);
      
      if (projectSnapshot.empty) {
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: "Project not found"
        });
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      
      const projectDoc = projectSnapshot.docs[0];
      const project = projectDoc.data() as any;
      
      try {
        // Count total subdomains for progress tracking
        const subdomainsQuery = query(
          collection(db, "subdomains"),
          where("projectId", "==", project.id)
        );
        const subdomainsSnapshot = await getDocs(subdomainsQuery);
        const totalSubdomains = subdomainsSnapshot.size;
        
        // Retrieve existing progress if available
        let progress = task.progress || 0;
        let deletedCount = task.result?.deletedCount || 0;
        const batchSize = 100; // Delete 100 subdomains at a time
        
        // Get a batch of subdomains
        const subdomains = subdomainsSnapshot.docs.slice(0, batchSize);
        
        if (subdomains.length > 0) {
          // Delete the batch
          await Promise.all(
            subdomains.map(subdomainDoc => 
              deleteDoc(doc(db, "subdomains", subdomainDoc.id))
            )
          );
          
          // Update progress
          deletedCount += subdomains.length;
          const newProgress = totalSubdomains > 0 
            ? Math.min(95, Math.round((deletedCount / totalSubdomains) * 100)) 
            : 95;
          
          // Store partial results
          await updateTaskProgress(taskId, newProgress, {
            deletedCount,
            totalSubdomains
          });
          
          return NextResponse.json({
            success: true,
            message: "Partial deletion processed",
            progress: newProgress,
            deletedCount,
            totalSubdomains
          });
        } else {
          // All subdomains deleted, now delete the project
          await deleteDoc(doc(db, "projects", projectDoc.id));
          
          // Mark task as completed
          await updateTask(taskId, TASK_STATUS.COMPLETED, {
            result: {
              deletedCount,
              totalSubdomains,
              projectDeleted: true
            }
          });
          
          return NextResponse.json({
            success: true,
            message: "Project deletion completed",
            projectDeleted: true
          });
        }
      } catch (error: any) {
        console.error("Project deletion error:", error);
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: error.message || "Unknown error"
        });
        return NextResponse.json({ 
          error: "Project deletion failed", 
          details: error.message || "Unknown error" 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: "Unknown task type" 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error("Task processing error:", error);
    return NextResponse.json({ 
      error: "Failed to process task",
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
} 