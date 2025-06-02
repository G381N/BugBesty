import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Session } from 'next-auth';
import admin from '@/lib/firebaseAdmin';
import { generateReport } from '@/services/reportGenerator';

interface CustomSession extends Session {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

interface ReportRequestData {
  projectId: string;
  projectName: string;
  reproductionSteps: string;
  additionalNotes: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from Firebase Auth using email from session
    const firebaseUser = await admin.auth().getUserByEmail(session.user.email);
    if (!firebaseUser) {
      return NextResponse.json({ error: 'User not found in Firebase' }, { status: 404 });
    }

    const userId = firebaseUser.uid;
    const data = await request.json() as ReportRequestData;
    
    if (!data.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log(`Generating report for project ${data.projectId} by user ${userId}`);
    
    // Use Firestore Admin SDK to get vulnerabilities for the project
    const db = admin.firestore();
    
    // First, verify the project belongs to the user
    const projectRef = db.collection('projects').doc(data.projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const projectData = projectDoc.data();
    if (projectData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to project' }, { status: 403 });
    }
    
    // Get all subdomains for the project
    const subdomainsSnapshot = await db.collection('subdomains')
      .where('projectId', '==', data.projectId)
      .get();
    
    const vulnerabilityData: Array<{subdomain: string; vulns: Array<{type: string; severity: string; timestamp: string}>}> = [];
    
    // For each subdomain, get its vulnerabilities
    for (const subdomainDoc of subdomainsSnapshot.docs) {
      const subdomainData = subdomainDoc.data();
      const vulnerabilitiesSnapshot = await db.collection('vulnerabilities')
        .where('subdomainId', '==', subdomainDoc.id)
        .where('status', '==', 'found')
        .get();
      
      if (vulnerabilitiesSnapshot.empty) continue;
      
      const vulns = vulnerabilitiesSnapshot.docs.map(vulnDoc => {
        const vulnData = vulnDoc.data();
        return {
          type: vulnData.type || 'Unknown',
          severity: vulnData.severity || 'Unknown',
          timestamp: vulnData.created_at ? new Date(vulnData.created_at).toLocaleString() : 'Unknown'
        };
      });
      
      vulnerabilityData.push({
        subdomain: subdomainData.name || 'Unknown subdomain',
        vulns
      });
    }
    
    // Generate the report using the Gemini API
    const reportContent = await generateReport({
      projectName: data.projectName,
      vulnerabilities: vulnerabilityData,
      reproductionSteps: data.reproductionSteps || '',
      additionalNotes: data.additionalNotes || ''
    });
    
    // Save the report to Firestore
    const reportRef = db.collection('reports').doc();
    await reportRef.set({
      projectId: data.projectId,
      userId,
      content: reportContent,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      success: true, 
      reportId: reportRef.id,
      content: reportContent
    });
    
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 