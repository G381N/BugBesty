import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import admin from '@/lib/firebaseAdmin';
import { signOut } from 'next-auth/react';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    console.log('User deletion API - Session:', session);
    
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
      console.error('Failed to determine any user ID for deletion');
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    
    // Prefer Firebase Auth ID over session ID
    const effectiveUserId = firebaseAuthId || userId;
    console.log('Using effective user ID for operations:', effectiveUserId);
    
    // 1. Find all user's projects
    const projectsSnapshot = await admin.firestore()
      .collection('projects')
      .where('owner', '==', effectiveUserId)
      .get();
      
    console.log(`Found ${projectsSnapshot.size} projects to delete for user ${effectiveUserId}`);
      
    // 2. For each project, find and delete all subdomains and vulnerabilities
    const MAX_BATCH_SIZE = 500;
    let operationCount = 0;
    let batch = admin.firestore().batch();
    let deletionPromises = [];
    
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      
      // Get all subdomains for this project
      const subdomainsSnapshot = await admin.firestore()
        .collection('subdomains')
        .where('projectId', '==', projectId)
        .get();
      
      console.log(`Deleting ${subdomainsSnapshot.size} subdomains for project ${projectId}`);
      
      // For each subdomain, get and delete vulnerabilities
      for (const subdomainDoc of subdomainsSnapshot.docs) {
        const subdomainId = subdomainDoc.id;
        
        // Get vulnerabilities
        const vulnerabilitiesSnapshot = await admin.firestore()
          .collection('vulnerabilities')
          .where('subdomainId', '==', subdomainId)
          .get();
        
        // Add vulnerabilities to batch delete
        vulnerabilitiesSnapshot.docs.forEach(vulnDoc => {
          batch.delete(vulnDoc.ref);
          operationCount++;
          
          if (operationCount >= MAX_BATCH_SIZE) {
            deletionPromises.push(batch.commit());
            batch = admin.firestore().batch();
            operationCount = 0;
          }
        });
        
        // Add subdomain to batch delete
        batch.delete(subdomainDoc.ref);
        operationCount++;
        
        if (operationCount >= MAX_BATCH_SIZE) {
          deletionPromises.push(batch.commit());
          batch = admin.firestore().batch();
          operationCount = 0;
        }
      }
      
      // Add project to batch delete
      batch.delete(projectDoc.ref);
      operationCount++;
      
      if (operationCount >= MAX_BATCH_SIZE) {
        deletionPromises.push(batch.commit());
        batch = admin.firestore().batch();
        operationCount = 0;
      }
    }
    
    // 3. Delete the user document
    if (effectiveUserId) {
      const userRef = admin.firestore().collection('users').doc(effectiveUserId);
      batch.delete(userRef);
      operationCount++;
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      deletionPromises.push(batch.commit());
    }
    
    // Wait for all batch operations to complete
    await Promise.all(deletionPromises);
    
    // 4. Delete the Firebase Auth user
    if (firebaseAuthId) {
      try {
        await admin.auth().deleteUser(firebaseAuthId);
        console.log(`Deleted Firebase Auth user: ${firebaseAuthId}`);
      } catch (authError) {
        console.error('Error deleting Firebase Auth user:', authError);
        // Continue anyway to ensure response is sent
      }
    }
    
    console.log(`Successfully deleted user ${effectiveUserId} and all associated data`);
    
    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user account', details: error.message },
      { status: 500 }
    );
  }
} 