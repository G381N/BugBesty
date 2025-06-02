import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import admin from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase/firestore';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the project ID from params
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession();
    console.log('Project deletion API - Session:', session);
    
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
    
    // Prefer Firebase Auth ID over session ID
    const effectiveUserId = firebaseAuthId || userId;
    console.log('Using effective user ID for operations:', effectiveUserId);
    
    // Verify project exists
    const projectRef = admin.firestore().collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const projectData = projectDoc.data();
    
    // Verify ownership
    if (projectData && projectData.owner !== effectiveUserId) {
      console.log(`User ${effectiveUserId} does not own project ${projectId} (owner: ${projectData.owner})`);
      return NextResponse.json(
        { error: 'Not authorized to delete this project' },
        { status: 403 }
      );
    }
    
    // First step: Get all subdomains for this project
    const subdomainsSnapshot = await admin.firestore()
      .collection('subdomains')
      .where('projectId', '==', projectId)
      .get();
    
    console.log(`Starting deletion of ${subdomainsSnapshot.size} subdomains for project ${projectId}`);
    
    // Batch for better performance (max 500 operations per batch)
    const MAX_BATCH_SIZE = 500;
    let operationCount = 0;
    let batch = admin.firestore().batch();
    let vulnerabilityDeletionPromises = [];
    
    // For each subdomain, we need to delete all vulnerabilities
    for (const subdomainDoc of subdomainsSnapshot.docs) {
      const subdomainId = subdomainDoc.id;
      
      // Get vulnerabilities for this subdomain
      const vulnerabilitiesSnapshot = await admin.firestore()
        .collection('vulnerabilities')
        .where('subdomainId', '==', subdomainId)
        .get();
      
      // Delete each vulnerability
      vulnerabilitiesSnapshot.docs.forEach(vulnDoc => {
        batch.delete(vulnDoc.ref);
        operationCount++;
        
        // If batch is full, commit it and create a new one
        if (operationCount >= MAX_BATCH_SIZE) {
          vulnerabilityDeletionPromises.push(batch.commit());
          batch = admin.firestore().batch();
          operationCount = 0;
        }
      });
      
      // Delete the subdomain
      batch.delete(subdomainDoc.ref);
      operationCount++;
      
      // If batch is full, commit it and create a new one
      if (operationCount >= MAX_BATCH_SIZE) {
        vulnerabilityDeletionPromises.push(batch.commit());
        batch = admin.firestore().batch();
        operationCount = 0;
      }
    }
    
    // If there are remaining operations in the batch, commit it
    if (operationCount > 0) {
      vulnerabilityDeletionPromises.push(batch.commit());
    }
    
    // Wait for all batches to complete
    await Promise.all(vulnerabilityDeletionPromises);
    
    // Finally, delete the project
    await projectRef.delete();
    
    console.log(`Successfully deleted project ${projectId} and all associated data`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { 
      error: 'Failed to delete project',
      details: error.message 
      },
      { status: 500 }
    );
  }
} 