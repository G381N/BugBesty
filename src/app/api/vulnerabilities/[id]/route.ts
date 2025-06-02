import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const vulnerabilityId = params.id;
    
    if (!vulnerabilityId) {
      return NextResponse.json(
        { error: 'Vulnerability ID is required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to update vulnerability with ID: ${vulnerabilityId}`, data);
    
    // Find vulnerability by id
    const vulnerabilityQuery = query(
      collection(db, "vulnerabilities"),
      where("id", "==", vulnerabilityId)
    );
    const vulnerabilitySnapshot = await getDocs(vulnerabilityQuery);
    
    if (vulnerabilitySnapshot.empty) {
      // Try finding by document ID directly
      try {
        const directDocRef = doc(db, "vulnerabilities", vulnerabilityId);
        const directDocSnap = await getDoc(directDocRef);
        
        if (directDocSnap.exists()) {
          const vulnerability = directDocSnap.data();
          console.log(`Found vulnerability by direct document ID: ${vulnerabilityId}`);
          
          // Update fields
          const updates: any = {
            updatedAt: new Date().toISOString()
          };
          
          if (data.status) {
            updates.status = data.status;
          }
          
          if (data.notes !== undefined) {
            updates.notes = data.notes;
          }
          
          if (data.recreation_steps !== undefined) {
            updates.recreation_steps = data.recreation_steps;
          }

          console.log(`Updating vulnerability document directly: vulnerabilities/${vulnerabilityId}`, updates);
          
          await updateDoc(directDocRef, updates);
          
          // Return updated vulnerability with merged data
          const updatedVulnerability = {
            ...vulnerability,
            ...updates
          };
          
          console.log(`Successfully updated vulnerability ${vulnerabilityId}`);
          
          // Return updated vulnerability
          return NextResponse.json(updatedVulnerability);
        }
      } catch (directError) {
        console.error(`Error checking direct document: ${directError}`);
      }
      
      console.error(`Vulnerability with ID ${vulnerabilityId} not found`);
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }
    
    const vulnerabilityDoc = vulnerabilitySnapshot.docs[0];
    const vulnerability = vulnerabilityDoc.data();
    
    // Update fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (data.status) {
      updates.status = data.status;
    }
    
    if (data.notes !== undefined) {
      updates.notes = data.notes;
    }
    
    if (data.recreation_steps !== undefined) {
      updates.recreation_steps = data.recreation_steps;
    }

    console.log(`Updating vulnerability document at path: vulnerabilities/${vulnerabilityDoc.id}`, updates);
    
    await updateDoc(doc(db, "vulnerabilities", vulnerabilityDoc.id), updates);
    
    // Return updated vulnerability with merged data
    const updatedVulnerability = {
      ...vulnerability,
      ...updates
    };
    
    console.log(`Successfully updated vulnerability ${vulnerabilityId}`);
    
    // Return updated vulnerability
    return NextResponse.json(updatedVulnerability);
  } catch (error: any) {
    console.error('Error updating vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to update vulnerability', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vulnerabilityId = params.id;
    
    if (!vulnerabilityId) {
      return NextResponse.json(
        { error: 'Vulnerability ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching vulnerability with ID: ${vulnerabilityId}`);
    
    // Try to find vulnerability by id field first
    const vulnerabilityQuery = query(
      collection(db, "vulnerabilities"),
      where("id", "==", vulnerabilityId)
    );
    const vulnerabilitySnapshot = await getDocs(vulnerabilityQuery);
    
    if (!vulnerabilitySnapshot.empty) {
      const vulnerability = vulnerabilitySnapshot.docs[0].data();
      console.log(`Found vulnerability by id field: ${vulnerabilityId}`);
      return NextResponse.json(vulnerability);
    }
    
    // If not found by id field, try to get the document directly
    try {
      const directDocRef = doc(db, "vulnerabilities", vulnerabilityId);
      const directDocSnap = await getDoc(directDocRef);
      
      if (directDocSnap.exists()) {
        const vulnerability = directDocSnap.data();
        console.log(`Found vulnerability by direct document ID: ${vulnerabilityId}`);
        return NextResponse.json(vulnerability);
      }
    } catch (directError) {
      console.error(`Error checking direct document: ${directError}`);
    }
    
    console.error(`Vulnerability with ID ${vulnerabilityId} not found`);
    return NextResponse.json(
      { error: 'Vulnerability not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 