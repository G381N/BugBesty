import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTask } from "@/lib/backgroundTasks";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Session } from "next-auth";

interface CustomSession extends Session {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession | null;
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // For security, verify this user owns the project associated with the task
    if (task.type === "subdomain_enumeration" || task.type === "project_deletion") {
      const projectQuery = query(
        collection(db, "projects"),
        where("id", "==", task.data.projectId)
      );
      const projectSnapshot = await getDocs(projectQuery);
      
      if (projectSnapshot.empty) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      
      const project = projectSnapshot.docs[0].data();
      
      if (project.owner !== session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Return task status without sensitive data
    return NextResponse.json({
      id: task.id,
      type: task.type,
      status: task.status,
      progress: task.progress || 0,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error: any) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task status", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
} 