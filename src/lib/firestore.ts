import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to convert Firestore document to a plain object with ID
const convertDocToObject = <T>(doc: QueryDocumentSnapshot<DocumentData>): T & { id: string } => {
  return {
    id: doc.id, 
    ...doc.data()
  } as T & { id: string };
};

// Get a single document by ID
export async function getDocument<T>(collectionName: string, id: string): Promise<T & { id: string } | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as T & { id: string };
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

// Get multiple documents from a collection with optimized query
export async function getDocuments<T>(
  collectionName: string, 
  options?: {
    fieldPath?: string;
    operator?: any;
    value?: any;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
  }
): Promise<(T & { id: string })[]> {
  try {
    let q = collection(db, collectionName);
    let queryConstraints = [];
    
    // Only add where clause if all parameters are provided
    if (options?.fieldPath && options?.operator && options.value !== undefined) {
      queryConstraints.push(where(options.fieldPath, options.operator, options.value));
    }
    
    // Add orderBy only if field is specified
    if (options?.orderByField) {
      const direction = options.orderDirection || 'asc';
      queryConstraints.push(orderBy(options.orderByField, direction));
    }
    
    // Add limit if specified
    if (options?.limitCount) {
      queryConstraints.push(limit(options.limitCount));
    }
    
    // Create query with constraints
    const finalQuery = query(q, ...queryConstraints);
    const snapshot = await getDocs(finalQuery);
    
    return snapshot.docs.map(doc => convertDocToObject<T>(doc));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    // If there's an index error, try a simpler query
    if (error instanceof Error && error.message.includes('index')) {
      console.log('Falling back to simpler query without ordering');
      try {
        const q = collection(db, collectionName);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => convertDocToObject<T>(doc));
      } catch (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// Create document with auto-generated ID
export async function createDocument<T>(collectionName: string, data: T): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), data as DocumentData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

// Create document with specific ID
export async function createDocumentWithId<T>(collectionName: string, id: string, data: T): Promise<void> {
  try {
    console.log(`Attempting to create document in ${collectionName} with ID ${id}`);
    
    // Add timestamp for logging
    const withTimestamps = {
      ...data,
      _createdAt: new Date().toISOString() // Meta field for debugging
    };
    
    const docRef = doc(db, collectionName, id);
    
    try {
      await setDoc(docRef, withTimestamps as DocumentData);
      console.log(`Successfully created document in ${collectionName} with ID ${id}`);
    } catch (innerError: any) {
      console.error(`Inner error creating document in ${collectionName}:`, innerError);
      console.error(`Error code: ${innerError.code}, Error message: ${innerError.message}`);
      
      // Try again with a simplified object if the first attempt failed
      if (data && typeof data === 'object') {
        console.log('Attempting to create document with simplified object...');
        
        // Create a simpler version of the object for troubleshooting
        const simplifiedData: any = {};
        
        // Copy only primitive values and simple objects
        for (const [key, value] of Object.entries(data as any)) {
          if (
            value === null ||
            typeof value === 'string' || 
            typeof value === 'number' || 
            typeof value === 'boolean'
          ) {
            simplifiedData[key] = value;
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Shallow copy for simple objects, skip complex nested structures
            simplifiedData[key] = {...value};
          }
        }
        
        await setDoc(docRef, simplifiedData as DocumentData);
        console.log(`Created document with simplified data in ${collectionName} with ID ${id}`);
      } else {
        throw innerError; // Re-throw if we can't simplify
      }
    }
  } catch (error) {
    console.error(`Error creating document with ID in ${collectionName}:`, error);
    
    // Include collection name and ID in the error for better debugging
    const enhancedError = new Error(`Failed to create document in ${collectionName} with ID ${id}: ${error}`);
    (enhancedError as any).originalError = error;
    
    throw enhancedError;
  }
}

// Update document
export async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as DocumentData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

// Delete document
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
} 