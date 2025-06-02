import { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getDocument, createDocumentWithId } from '@/lib/firestore';
import type { User } from '@/models/User';
import { doc, setDoc } from 'firebase/firestore';

// Collection name
const USERS_COLLECTION = 'users';

/**
 * Create a Firestore user profile from Firebase Auth user
 */
export async function createUserProfile(firebaseUser: FirebaseUser): Promise<void> {
  try {
    console.log('Attempting to create user profile for:', firebaseUser.uid, firebaseUser.email);
    
    // Check if a profile already exists
    try {
      const existingUser = await getDocument<User>(USERS_COLLECTION, firebaseUser.uid);
      
      if (existingUser) {
        console.log('User profile already exists in Firestore');
        return;
      }
    } catch (checkError) {
      console.error('Error checking for existing user:', checkError);
      // Continue with creation attempt even if check fails
    }
    
    // Create a new user profile in Firestore
    const now = new Date();
    const userData: User = {
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      role: 'user',
      onboarding: {
        completed: false,
        answers: {}
      },
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Creating user document with data:', userData);
    
    // Try direct Firestore method if the helper function fails
    try {
      // First, try with the helper function
      await createDocumentWithId<User>(USERS_COLLECTION, firebaseUser.uid, userData);
      console.log('User profile created in Firestore with ID:', firebaseUser.uid);
    } catch (helperError) {
      console.error('Helper function failed, trying direct Firestore API:', helperError);
      
      // Fallback to direct Firestore API
      const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
      await setDoc(userDocRef, userData);
      console.log('User profile created using direct Firestore API with ID:', firebaseUser.uid);
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get current Firebase Auth user
 */
export async function getCurrentFirebaseUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Convert Firebase user to NextAuth user format
 */
export function convertFirebaseUserToNextAuth(firebaseUser: FirebaseUser) {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    image: firebaseUser.photoURL || null,
  };
} 