import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/firestore';
import { Vulnerability, VulnerabilityModel } from '@/models/Vulnerability';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subdomainId = params.id;
    
    if (!subdomainId) {
      return NextResponse.json(
        { error: 'Subdomain ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching vulnerabilities for subdomain: ${subdomainId}`);
    
    const vulnerabilities = await getDocuments<Vulnerability>('vulnerabilities', {
      fieldPath: 'subdomainId',
      operator: '==',
      value: subdomainId
    });
    
    console.log(`Found ${vulnerabilities.length} vulnerabilities for subdomain ${subdomainId}`);
    
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return NextResponse.json([]);  // Return empty array if no vulnerabilities found
    }
    
    // Sort by severity and type
    // We have to sort manually since we don't have a compound index
    const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
      // First sort by severity (High > Medium > Low)
      const severityOrder: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      
      if (severityDiff !== 0) return severityDiff;
      
      // Then sort by type alphabetically
      return (a.type || '').localeCompare(b.type || '');
    });
    
    return NextResponse.json(sortedVulnerabilities);
  } catch (error: any) {
    console.error('Error fetching vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerabilities', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subdomainId = params.id;
    
    if (!subdomainId) {
      return NextResponse.json(
        { error: 'Subdomain ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    if (!data.type) {
      return NextResponse.json(
        { error: 'Vulnerability type is required' },
        { status: 400 }
      );
    }
    
    const vulnerability = await VulnerabilityModel.create({
      ...data,
      subdomainId
    });
    
    return NextResponse.json(vulnerability);
  } catch (error: any) {
    console.error('Error creating vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to create vulnerability', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 