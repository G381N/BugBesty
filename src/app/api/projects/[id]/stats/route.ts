import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getServerSession } from 'next-auth';

interface ProjectStats {
  totalSubdomains: number;
  vulnerabilitiesByStatus: Record<string, number>;
  vulnerabilitiesBySeverity: Record<string, number>;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fix: Properly retrieve params
    const projectId = await Promise.resolve(params.id);
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get Firebase user ID
    let userId = null;
    
    if (session.user.email) {
      try {
        const authUser = await admin.auth().getUserByEmail(session.user.email);
        userId = authUser.uid;
      } catch (error) {
        console.error('Error finding user by email:', error);
      }
    }
    
    if (!userId && session.user.id) {
      userId = session.user.id;
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
    
    // Get all subdomains for this project
    const subdomainsRef = db.collection('subdomains');
    const subdomainsQuery = subdomainsRef.where('projectId', '==', projectId);
    const subdomainsSnapshot = await subdomainsQuery.get();
    const totalSubdomains = subdomainsSnapshot.size;
    
    // Get the IDs of all subdomains
    const subdomainIds = subdomainsSnapshot.docs.map(doc => doc.id);
    
    // Initialize stats
    const stats: ProjectStats = {
      totalSubdomains,
      vulnerabilitiesByStatus: {
        'Found': 0,
        'Not Found': 0,
        'Not Yet Done': 0
      },
      vulnerabilitiesBySeverity: {
        'High': 0,
        'Medium': 0,
        'Low': 0
      }
    };
    
    // If there are no subdomains, return the empty stats
    if (subdomainIds.length === 0) {
      return NextResponse.json(stats);
    }
    
    // Get all vulnerabilities for all subdomains
    const vulnerabilitiesRef = db.collection('vulnerabilities');
    const vulnerabilitiesSnapshot = await vulnerabilitiesRef
      .where('subdomainId', 'in', subdomainIds.slice(0, 10)) // Firestore "in" supports max 10 items
      .get();
    
    // Process vulnerabilities
    vulnerabilitiesSnapshot.forEach(doc => {
      const vuln = doc.data();
      
      // Count by status
      if (vuln.status && stats.vulnerabilitiesByStatus[vuln.status] !== undefined) {
        stats.vulnerabilitiesByStatus[vuln.status]++;
      }
      
      // Count by severity
      if (vuln.severity && stats.vulnerabilitiesBySeverity[vuln.severity] !== undefined) {
        stats.vulnerabilitiesBySeverity[vuln.severity]++;
      }
    });
    
    // If we have more than 10 subdomains, we need to make additional queries
    if (subdomainIds.length > 10) {
      for (let i = 10; i < subdomainIds.length; i += 10) {
        const batch = subdomainIds.slice(i, i + 10);
        if (batch.length === 0) break;
        
        const batchSnapshot = await vulnerabilitiesRef
          .where('subdomainId', 'in', batch)
          .get();
          
        batchSnapshot.forEach(doc => {
          const vuln = doc.data();
          
          // Count by status
          if (vuln.status && stats.vulnerabilitiesByStatus[vuln.status] !== undefined) {
            stats.vulnerabilitiesByStatus[vuln.status]++;
          }
          
          // Count by severity
          if (vuln.severity && stats.vulnerabilitiesBySeverity[vuln.severity] !== undefined) {
            stats.vulnerabilitiesBySeverity[vuln.severity]++;
          }
        });
      }
    }
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats', details: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
} 