import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/firebase';
import { query, collection, where, getDocs, doc, getDoc } from 'firebase/firestore';
import admin from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    console.log('[SYNC-API] Firebase Token API - Session:', session);
    
    if (!session?.user) {
      console.log('[SYNC-API] No session user found');
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
    }
    
    // Debug logging
    console.log('[SYNC-API] User from session:', {
      id: session.user.id || 'not set',
      email: session.user.email || 'not set',
      name: session.user.name || 'not set'
    });
    
    // Check current Firebase Auth state on the client
    try {
      const { auth } = await import('@/lib/firebase');
      console.log('[SYNC-API] Current Auth state:', auth.currentUser ? 
        `User is signed in as: ${auth.currentUser.uid}` : 
        'No user signed in');
    } catch (error) {
      console.log('[SYNC-API] Error checking auth state:', error);
    }
    
    // First check if we have the user ID in the session
    if (session.user.id) {
      console.log('[SYNC-API] Using session user ID:', session.user.id);
      
      try {
        // First verify that this user ID exists in Firebase Auth
        try {
          const authUser = await admin.auth().getUser(session.user.id);
          console.log('[SYNC-API] Firebase Auth user found:', authUser.uid);
        } catch (authError: any) {
          console.log('[SYNC-API] User ID not found in Firebase Auth, will create token anyway:', authError.message);
        }
        
        const customToken = await admin.auth().createCustomToken(session.user.id);
        console.log('[SYNC-API] Generated custom token of length:', customToken.length);
        return NextResponse.json({ token: customToken });
      } catch (error: any) {
        console.error('[SYNC-API] Error creating custom token with user ID:', error);
        return NextResponse.json(
          { error: 'Token creation failed', details: error.message }, 
          { status: 500 }
        );
      }
    }
    
    // If no ID in session but email exists, look up by email in Firebase Auth first
    if (session.user.email) {
      console.log('[SYNC-API] No user ID in session, looking up by email:', session.user.email);
      
      try {
        // First try to find the user in Firebase Auth by email
        try {
          const authUser = await admin.auth().getUserByEmail(session.user.email);
          console.log('[SYNC-API] Found user in Firebase Auth by email:', authUser.uid);
          
          // Create custom token with Firebase Auth UID
          const customToken = await admin.auth().createCustomToken(authUser.uid);
          console.log('[SYNC-API] Generated custom token for Firebase Auth user:', authUser.uid);
          return NextResponse.json({ token: customToken });
        } catch (authError) {
          console.log('[SYNC-API] User not found in Firebase Auth by email:', authError);
        }
        
        // If not found in Auth, look in Firestore
        console.log('[SYNC-API] Looking up user in Firestore by email');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', session.user.email));
        
        try {
          console.log('[SYNC-API] Querying Firestore for user with email:', session.user.email);
          const querySnapshot = await getDocs(q);
          console.log('[SYNC-API] Query returned', querySnapshot.size, 'documents');
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            console.log('[SYNC-API] Found user document with ID:', userId);
            
            // Create custom token with this user ID
            try {
              console.log('[SYNC-API] Generating custom token for user ID:', userId);
              const customToken = await admin.auth().createCustomToken(userId);
              console.log('[SYNC-API] Generated custom token of length:', customToken.length);
              return NextResponse.json({ token: customToken });
            } catch (tokenError: any) {
              console.error('[SYNC-API] Error creating custom token:', tokenError);
              return NextResponse.json(
                { error: 'Token creation failed', details: tokenError.message }, 
                { status: 500 }
              );
            }
          } else {
            console.log('[SYNC-API] No user found with email:', session.user.email);
            
            // As a last resort, create a new Firebase Auth user
            try {
              console.log('[SYNC-API] Creating new Firebase Auth user with email:', session.user.email);
              const newUser = await admin.auth().createUser({
                email: session.user.email,
                displayName: session.user.name || undefined,
                emailVerified: true
              });
              
              console.log('[SYNC-API] Created new Firebase Auth user:', newUser.uid);
              
              // Create a user document in Firestore
              const userDocRef = doc(db, 'users', newUser.uid);
              await admin.firestore().doc(`users/${newUser.uid}`).set({
                email: session.user.email,
                name: session.user.name || '',
                emailVerified: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log('[SYNC-API] Created Firestore user document');
              
              const customToken = await admin.auth().createCustomToken(newUser.uid);
              console.log('[SYNC-API] Generated custom token for new user:', newUser.uid);
              return NextResponse.json({ token: customToken });
            } catch (createError: any) {
              console.error('[SYNC-API] Failed to create new user:', createError);
              return NextResponse.json({ error: 'User not found and could not be created', details: createError.message }, { status: 404 });
            }
          }
        } catch (error: any) {
          console.error('[SYNC-API] Error querying Firestore:', error);
          return NextResponse.json(
            { error: 'Failed to query user database', details: error.message }, 
            { status: 500 }
          );
        }
      } catch (error: any) {
        console.error('[SYNC-API] Error in email lookup process:', error);
        return NextResponse.json(
          { error: 'Email lookup failed', details: error.message }, 
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ error: 'No user found in session' }, { status: 401 });
  } catch (error: any) {
    console.error('[SYNC-API] Error creating Firebase token:', error);
    return NextResponse.json(
      { error: 'Failed to create token', details: error.message }, 
      { status: 500 }
    );
  }
} 