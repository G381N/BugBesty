import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

export async function GET() {
  try {
    // Test collection
    const testCollection = collection(db, 'test');
    
    // Test write operation
    const testDoc = await addDoc(testCollection, {
      timestamp: new Date().toISOString(),
      test: true
    });
    
    // Test read operation
    const snapshot = await getDocs(testCollection);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Clean up test document
    await deleteDoc(doc(db, 'test', testDoc.id));
    
    return NextResponse.json({
      status: 'success',
      message: 'Firestore operations successful',
      testWrite: testDoc.id,
      testRead: docs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firestore test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Firestore operations failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 