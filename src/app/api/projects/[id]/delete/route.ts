import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { createTask } from "@/lib/backgroundTasks";
import { Session } from "next-auth";

interface CustomSession extends Session {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession | null;
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Find the project
    const projectQuery = query(
      collection(db, "projects"),
      where("id", "==", projectId)
    );
    const projectSnapshot = await getDocs(projectQuery);
    
    if (projectSnapshot.empty) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    const projectDoc = projectSnapshot.docs[0];
    const project = projectDoc.data();

    // Check if the user owns the project
    if (project.owner !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a deletion task
    const task = await createTask("project_deletion", {
      projectId: project.id
    });

    // Update project status to indicate deletion in progress
    await updateDoc(doc(db, "projects", projectDoc.id), {
      status: "deleting",
      deletionTaskId: task.id,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Project deletion started",
      taskId: task.id
    });
  } catch (error: any) {
    console.error("Error starting project deletion:", error);
    return NextResponse.json(
      { error: "Failed to start project deletion", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
} 