import { NextResponse } from 'next/server';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocument, getDocuments, deleteDocument } from '@/lib/firestore';
import { Subdomain } from '@/models/Subdomain';
import { Vulnerability } from '@/models/Vulnerability';
import { getServerSession } from 'next-auth';
import admin from '@/lib/firebaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Use await to ensure params is properly resolved
  const subdomainId = await Promise.resolve(params.id);
  
  try {
    const session = await getServerSession();
    console.log(`[API] Subdomain fetch request for ID: ${subdomainId}, session:`, session?.user?.email);
    
    if (!session?.user) {
      console.log('[API] Unauthorized - no session user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!subdomainId) {
      console.log('[API] Missing subdomain ID in request');
      return NextResponse.json({ error: 'Subdomain ID is required' }, { status: 400 });
    }
    
    // Get Firebase user ID - first try to find user by email
    let userId = null;
    
    if (session.user.email) {
      try {
        const authUser = await admin.auth().getUserByEmail(session.user.email);
        userId = authUser.uid;
        console.log(`[API] Found Firebase user by email: ${userId}`);
      } catch (error) {
        console.error('[API] Error finding user by email:', error);
      }
    }
    
    if (!userId && session.user.id) {
      userId = session.user.id;
      console.log(`[API] Using session user ID: ${userId}`);
    }
    
    if (!userId) {
      console.log('[API] No user ID could be determined');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the subdomain
    const db = admin.firestore();
    const subdomainRef = db.collection('subdomains').doc(subdomainId);
    const subdomainDoc = await subdomainRef.get();
    
    if (!subdomainDoc.exists) {
      console.log(`[API] Subdomain ${subdomainId} not found`);
      return NextResponse.json({ error: 'Subdomain not found' }, { status: 404 });
    }
    
    const subdomainData = subdomainDoc.data();
    
    // Check if subdomainData exists
    if (!subdomainData) {
      console.log(`[API] Subdomain ${subdomainId} data is empty`);
      return NextResponse.json({ error: 'Subdomain data is empty' }, { status: 500 });
    }
    
    // Verify user has access to the related project
    if (subdomainData.projectId) {
      const projectRef = db.collection('projects').doc(subdomainData.projectId);
      const projectDoc = await projectRef.get();
      
      if (!projectDoc.exists) {
        console.log(`[API] Related project ${subdomainData.projectId} not found`);
        return NextResponse.json({ error: 'Related project not found' }, { status: 404 });
      }
      
      const projectData = projectDoc.data();
      
      // Check if user has access to the project
      if (projectData && 
          projectData.owner !== userId && 
          (!projectData.team || !projectData.team.includes(userId))) {
        console.log(`[API] User ${userId} doesn't have access to project ${subdomainData.projectId}`);
        return NextResponse.json({ error: 'Not authorized to access this subdomain' }, { status: 403 });
      }
    }
    
    // Return the subdomain with its ID and ensure hostname is set (use name as fallback)
    const result = {
      id: subdomainId,
      ...subdomainData,
      // Ensure hostname is set - use name property if hostname is missing
      hostname: subdomainData.hostname || subdomainData.name || ''
    };
    
    console.log(`[API] Successfully returning subdomain data:`, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error fetching subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomain', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Use await to ensure params is properly resolved
  const subdomainId = await Promise.resolve(params.id);
  
  try {
    if (!subdomainId) {
      return NextResponse.json(
        { error: 'Subdomain ID is required' },
        { status: 400 }
      );
    }
    
    // Delete all vulnerabilities associated with this subdomain
    const vulnerabilities = await getDocuments<Vulnerability>('vulnerabilities', {
      fieldPath: 'subdomainId',
      operator: '==',
      value: subdomainId
    });
    
    // Delete each vulnerability
    for (const vulnerability of vulnerabilities) {
      await deleteDocument('vulnerabilities', vulnerability.id);
    }
    
    // Delete the subdomain
    const subdomain = await getDocument<Subdomain>('subdomains', subdomainId);
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }
    
    await deleteDocument('subdomains', subdomainId);
    
    return NextResponse.json({ message: 'Subdomain deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to delete subdomain', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 