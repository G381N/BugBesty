import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params.id is awaited
    const subdomainId = params?.id;
    if (!subdomainId) {
      return NextResponse.json(
        { error: 'Subdomain ID is required' },
        { status: 400 }
      );
    }

    const { vulnerabilityIds } = await request.json();
    if (!vulnerabilityIds || !Array.isArray(vulnerabilityIds) || vulnerabilityIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid vulnerability IDs are required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete ${vulnerabilityIds.length} vulnerabilities for subdomain ${subdomainId}`);

    // Verify the subdomain exists
    const subdomainRef = collection(db, "subdomains");
    const subQuery = query(subdomainRef, where("id", "==", subdomainId));
    const subSnapshot = await getDocs(subQuery);
    
    if (subSnapshot.empty) {
      return NextResponse.json(
        { error: `Subdomain with ID ${subdomainId} not found` },
        { status: 404 }
      );
    }

    // Get all vulnerabilities for this subdomain to verify IDs
    const vulnerabilitiesRef = collection(db, "vulnerabilities");
    const vulnQuery = query(vulnerabilitiesRef, where("subdomainId", "==", subdomainId));
    const vulnSnapshot = await getDocs(vulnQuery);
    
    if (vulnSnapshot.empty) {
      return NextResponse.json(
        { error: `No vulnerabilities found for subdomain ${subdomainId}` },
        { status: 404 }
      );
    }

    // Create a map of valid vulnerability documents by ID
    const validVulnerabilities = new Map();
    vulnSnapshot.forEach(docSnapshot => {
      const vulnData = docSnapshot.data();
      if (vulnData.id && vulnerabilityIds.includes(vulnData.id)) {
        validVulnerabilities.set(vulnData.id, {
          docId: docSnapshot.id,
          data: vulnData
        });
      }
    });

    // Check if we found any valid vulnerabilities
    if (validVulnerabilities.size === 0) {
      return NextResponse.json(
        { error: `None of the provided vulnerability IDs (${vulnerabilityIds.join(', ')}) exist for this subdomain` },
        { status: 400 }
      );
    }

    // Delete the valid vulnerabilities
    for (const [vulnId, vulnInfo] of validVulnerabilities.entries()) {
      await deleteDoc(doc(db, "vulnerabilities", vulnInfo.docId));
      console.log(`Deleted vulnerability ${vulnId} (doc ID: ${vulnInfo.docId})`);
    }

    return NextResponse.json({ 
      message: 'Vulnerabilities deleted successfully', 
      deletedCount: validVulnerabilities.size,
      deletedIds: Array.from(validVulnerabilities.keys())
    });
  } catch (error: any) {
    console.error('Error deleting vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to delete vulnerabilities', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 