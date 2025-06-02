import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const { email } = session?.user || {};
    
    console.log('Processing onboarding request for:', email);
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    console.log('Onboarding data received:', data);
    
    // Check if user ID is in session
    let userId = session?.user?.id;
    
    if (!userId) {
      console.log('No user ID in session, trying to find by email');
      
      // First look in Firebase Auth
      try {
        const authUser = await admin.auth().getUserByEmail(email);
        if (authUser) {
          userId = authUser.uid;
          console.log('Found user in Firebase Auth by email:', userId);
        }
      } catch (error) {
        console.log('User not found in Firebase Auth by email:', error);
      }
      
      // If not found in Firebase Auth, try Firestore
      if (!userId) {
        try {
          // Try to find user in Firestore
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            userId = userDoc.id;
            console.log('Found user in Firestore by email:', userId);
          }
        } catch (error) {
          console.log('Error finding user in Firestore:', error);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: 'Could not find user profile in database' 
      }, { status: 404 });
    }
    
    console.log('Updating user with onboarding data, user ID:', userId);
    
    // Prepare onboarding data
    const onboardingUpdate = {
      'onboarding.completed': true,
      'onboarding.answers': data,
      updatedAt: new Date()
    };
    
    // Use Firebase Admin to update the document
    try {
      console.log('Updating user document using Firebase Admin');
      await admin.firestore().collection('users').doc(userId).update({
        'onboarding.completed': true,
        'onboarding.answers': data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('User onboarding data updated successfully via Firebase Admin');
      return NextResponse.json({ success: true });
    } catch (adminError) {
      console.error('Error updating via Firebase Admin:', adminError);
      
      // Fall back to client-side Firestore
      try {
        console.log('Falling back to client-side Firestore update');
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, onboardingUpdate);
        
        console.log('User onboarding data updated successfully via client Firestore');
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('Error updating user onboarding data:', error);
        return NextResponse.json({ 
          error: 'Failed to update user profile',
          details: error.message 
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Unexpected error in onboarding API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 