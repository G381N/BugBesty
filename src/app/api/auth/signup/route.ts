import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '@/utils/authUtils';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Processing signup request for:', email);

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    let userId = null;
    
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      userId = user.uid;
      
      // Update the user profile with the name
      await updateProfile(user, {
        displayName: name.trim()
      });
      
      console.log('Firebase Auth user created with ID:', user.uid);
      
      // Create a user profile in Firestore
      try {
        await createUserProfile(user);
        console.log('Firestore user profile created successfully using helper function');
      } catch (firestoreError) {
        console.error('Failed to create Firestore profile using helper function:', firestoreError);
        
        // Try direct Firestore API as a fallback
        try {
          console.log('Attempting direct Firestore document creation...');
          const now = new Date();
          const userData: User = {
            name: name.trim(),
            email: email,
            role: 'user',
            onboarding: {
              completed: false,
              answers: {}
            },
            createdAt: now,
            updatedAt: now
          };
          
          // Create user document directly
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, userData);
          console.log('User document created directly in Firestore');
        } catch (directError) {
          console.error('Direct Firestore creation also failed:', directError);
          // Continue with the response even if Firestore profile creation fails
          // The user can still authenticate, and we can try to create the profile later
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.uid,
          name: user.displayName || name.trim(),
          email: user.email,
        }
      });

    } catch (firebaseError: any) {
      console.error('Firebase operation failed:', firebaseError);
      
      // Handle Firebase auth errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      throw firebaseError;
    }

  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Get error message
    const errorMessage = error?.message || 'Unknown error';

    return NextResponse.json(
      { 
        error: 'Failed to create account',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
