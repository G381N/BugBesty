import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getServerSession } from 'next-auth';
import admin from '@/lib/firebaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Use await to ensure params is properly resolved
  const projectId = await Promise.resolve(params.id);
  
  try {
    const session = await getServerSession();
    console.log('Fetching subdomains for project', projectId);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate that a project ID was provided
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Get Firebase user ID
    let userId = null;
    
    if (session.user.email) {
      try {
        const authUser = await admin.auth().getUserByEmail(session.user.email);
        userId = authUser.uid;
        console.log('Found user in Firebase Auth by email:', userId);
      } catch (error) {
        console.error('Error finding user by email:', error);
      }
    }
    
    if (!userId && session.user.id) {
      userId = session.user.id;
      console.log('Using session user ID:', userId);
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the project to check ownership
    const db = admin.firestore();
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const projectData = projectDoc.data();
    
    // Check if user has access to the project
    if (projectData && 
        projectData.owner !== userId && 
        (!projectData.team || !projectData.team.includes(userId))) {
      return NextResponse.json(
        { error: 'Not authorized to access this project' }, 
        { status: 403 }
      );
    }
    
    // Query subdomains for this project
    const subdomainsRef = db.collection('subdomains');
    const q = subdomainsRef.where('projectId', '==', projectId);
    const snapshot = await q.get();
    
    const subdomains = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure hostname is always set (use name as fallback)
      hostname: doc.data().hostname || doc.data().name || ''
    }));
    
    console.log(`Found ${subdomains.length} subdomains for project ${projectId}`);
    
    return NextResponse.json(subdomains);
  } catch (error: any) {
    console.error('Error fetching subdomains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomains', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 