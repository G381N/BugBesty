import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

// Helper function to chunk an array into smaller arrays of max size
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Valid vulnerability IDs are required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete ${ids.length} vulnerabilities`);

    // Process IDs in chunks of 30 or fewer (Firestore 'in' query limit)
    const idChunks = chunkArray(ids, 30);
    console.log(`Split deletion into ${idChunks.length} batches`);
    
    const validVulnerabilities = new Map();
    
    // Process each chunk
    for (const chunk of idChunks) {
      // Get all vulnerabilities with matching IDs in this chunk
      const vulnerabilitiesRef = collection(db, "vulnerabilities");
      const vulnQuery = query(vulnerabilitiesRef, where("id", "in", chunk));
      const vulnSnapshot = await getDocs(vulnQuery);
      
      vulnSnapshot.forEach(docSnapshot => {
        const vulnData = docSnapshot.data();
        validVulnerabilities.set(vulnData.id, {
          docId: docSnapshot.id,
          data: vulnData
        });
      });
      
      // Also check if any IDs in the chunk are directly document IDs
      for (const id of chunk) {
        if (!validVulnerabilities.has(id)) {
          try {
            const directDocRef = doc(db, "vulnerabilities", id);
            const directDocSnap = await getDoc(directDocRef);
            
            if (directDocSnap.exists()) {
              const vulnData = directDocSnap.data();
              validVulnerabilities.set(id, {
                docId: id,
                data: vulnData
              });
            }
          } catch (error) {
            console.error(`Error checking if ${id} is a document ID:`, error);
          }
        }
      }
    }

    console.log(`Found ${validVulnerabilities.size} valid vulnerabilities to delete`);

    if (validVulnerabilities.size === 0) {
      return NextResponse.json(
        { error: 'No valid vulnerabilities found to delete' },
        { status: 404 }
      );
    }

    // Delete the valid vulnerabilities
    for (const [vulnId, vulnInfo] of validVulnerabilities.entries()) {
      await deleteDoc(doc(db, "vulnerabilities", vulnInfo.docId));
      console.log(`Deleted vulnerability ${vulnId} (doc ID: ${vulnInfo.docId})`);
    }

    return NextResponse.json({ 
      message: 'Vulnerabilities deleted successfully', 
      deleted: validVulnerabilities.size,
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