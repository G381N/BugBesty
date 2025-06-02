import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase config:', { 
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'CONFIGURED' : 'MISSING',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'CONFIGURED' : 'MISSING',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'CONFIGURED' : 'MISSING',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'CONFIGURED' : 'MISSING',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'CONFIGURED' : 'MISSING',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'CONFIGURED' : 'MISSING'
});

// Initialize Firebase only once
let app: FirebaseApp;
try {
  if (getApps().length === 0) {
    console.log('Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    console.log('Using existing Firebase app');
    app = getApps()[0];
  }
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw new Error('Failed to initialize Firebase. Check your configuration.');
}

// Initialize Firestore
let db: Firestore;
try {
  console.log('Initializing Firestore...');
  db = getFirestore(app);
  
  // Enable offline persistence when in browser environment
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .then(() => console.log('Firestore offline persistence enabled'))
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, offline persistence not enabled');
        } else if (err.code === 'unimplemented') {
          console.warn('Browser doesn\'t support indexed DB persistence');
        } else {
          console.error('Error enabling offline persistence:', err);
        }
      });
  }
  
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw new Error('Failed to initialize Firestore');
}

// Initialize Auth
let auth: Auth;
try {
  console.log('Initializing Firebase Auth...');
  auth = getAuth(app);
  
  // Enable local persistence to keep the user logged in
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Firebase Auth persistence set to LOCAL');
      })
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
      });
  }
  
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  throw new Error('Failed to initialize Firebase Auth');
}

// Connect to emulators in development if config exists
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  try {
    console.log('Connecting to Firebase emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Connected to Firebase emulators successfully');
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}

// Add event listeners for auth state changes
try {
  console.log('Setting up auth state change listener...');
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('Auth state changed: User is signed in', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        providerData: user.providerData.map(p => ({
          providerId: p.providerId,
          uid: p.uid,
          displayName: p.displayName,
          email: p.email
        }))
      });
    } else {
      console.log('Auth state changed: User is signed out');
    }
  });
} catch (error) {
  console.error('Error setting up auth state listener:', error);
}

export { app, db, auth }; 