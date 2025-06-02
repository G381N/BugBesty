import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import admin from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    console.log('Projects API - Session:', session);
    
    if (!session?.user) {
      console.error('No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Try to find user ID either from session or by email lookup
    let userId = session?.user?.id;
    let firebaseAuthId = null;
    
    if (session?.user?.email) {
      try {
        // First try to find the user in Firebase Auth by email
        const authUser = await admin.auth().getUserByEmail(session.user.email)
          .catch(() => null);
          
        if (authUser) {
          firebaseAuthId = authUser.uid;
          console.log('Found user in Firebase Auth by email:', firebaseAuthId);
        }
      } catch (error) {
        console.error('Error checking Firebase Auth:', error);
      }
    }
    
    if (!userId && !firebaseAuthId) {
      console.error('Failed to determine any user ID for fetching projects');
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    
    // Prefer Firebase Auth ID over session ID
    const effectiveUserId = firebaseAuthId || userId;
    console.log('Using effective user ID for operations:', effectiveUserId);
    
    // Query projects using Firebase Admin (bypasses security rules)
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('owner', '==', effectiveUserId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${projects.length} projects for user ${effectiveUserId}`);
    
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Error getting projects:', error);
    return NextResponse.json(
      { error: 'Failed to get projects', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    console.log('Project creation API - Session:', session);
    
    if (!session?.user) {
      console.error('No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, targetDomain, enumerationMethod } = await req.json();

    if (!name || !targetDomain) {
      return NextResponse.json(
        { error: "Name and target domain are required" },
        { status: 400 }
      );
    }
    
    // Try to find user ID either from session or by email lookup
    let userId = session?.user?.id;
    let firebaseAuthId = null;
    
    if (session?.user?.email) {
      try {
        // First try to find the user in Firebase Auth by email
        const authUser = await admin.auth().getUserByEmail(session.user.email)
          .catch(() => null);
          
        if (authUser) {
          firebaseAuthId = authUser.uid;
          console.log('Found user in Firebase Auth by email:', firebaseAuthId);
        }
      } catch (error) {
        console.error('Error checking Firebase Auth:', error);
      }
    }
    
    if (!userId && !firebaseAuthId) {
      console.error('Failed to determine any user ID for creating project');
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    
    // Prefer Firebase Auth ID over session ID
    const effectiveUserId = firebaseAuthId || userId;
    console.log('Using effective user ID for operations:', effectiveUserId);
    
    // Create project using Firebase Admin
    const projectRef = admin.firestore().collection('projects').doc();
    const projectId = projectRef.id;
    
    const projectData = {
      name,
      targetDomain,
      owner: effectiveUserId,
      team: [],
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Set the project data
    await projectRef.set(projectData);
    console.log(`Created project with ID: ${projectId}`);

    // If auto enumeration is selected, create a background task
    if (enumerationMethod === "auto") {
      try {
        const { createTask } = await import("@/lib/backgroundTasks");
        const task = await createTask("subdomain_enumeration", {
          projectId: projectId,
          targetDomain,
        });
        
        // Store task ID in project
        await projectRef.update({
          enumerationTaskId: task.id
        });
        
        console.log(`Created enumeration task: ${task.id} for project: ${projectId}`);
      } catch (error) {
        console.error("Failed to create background task:", error);
        // Continue without failing the entire request
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        name,
        targetDomain,
        status: "active",
        enumerationTaskId: enumerationMethod === "auto" ? "pending" : null,
      },
    });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: error.message },
      { status: 500 }
    );
  }
} 