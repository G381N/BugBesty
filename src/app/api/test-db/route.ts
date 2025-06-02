import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit } from 'firebase/firestore';

export async function GET() {
  try {
    // Test Firestore connection
    console.log('Testing Firestore connection...');
    
    // Try to get a test document
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    // Check if we can access Firestore
    return NextResponse.json({
      status: 'success',
      message: 'Firebase Firestore connection is working!',
      collectionExists: !snapshot.empty,
      documents: snapshot.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Firestore connection:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Firebase Firestore',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 