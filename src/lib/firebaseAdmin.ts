import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Use environment variable for service account path if available
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../bugbesty-9ded6-firebase-adminsdk-fbsvc-1507e6408a.json';
let serviceAccount;

try {
  // Try to load from file
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
    console.log('Attempting to load service account from:', resolvedPath);
    if (fs.existsSync(resolvedPath)) {
      const rawData = fs.readFileSync(resolvedPath, 'utf8');
      serviceAccount = JSON.parse(rawData);
      console.log('Successfully loaded service account from file');
    } else {
      console.warn('Service account file not found at:', resolvedPath);
    }
  }
} catch (error) {
  console.error('Error loading service account from file:', error);
}

// Fallback to environment variables if file loading fails
if (!serviceAccount) {
  console.log('Using service account from environment variables');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "client_id": process.env.FIREBASE_CLIENT_ID,
      "auth_uri": process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      "token_uri": process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
      "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
    };
  } else {
    console.error('Missing required Firebase environment variables');
  }
}

// Check if Firebase admin is already initialized to prevent multiple initializations
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.error('Failed to initialize Firebase Admin SDK: No valid service account found');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

export default admin; 