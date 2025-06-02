import { 
  createDocument, 
  getDocument, 
  getDocuments, 
  updateDocument,
  deleteDocument 
} from '@/lib/firestore';

// Define user interface
export interface User {
  name: string;
  email: string;
  role: 'user' | 'admin';
  onboarding?: {
    completed: boolean;
    answers: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const COLLECTION_NAME = 'users';

// User model methods
export const UserModel = {
  // Create a new user
  async create(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User & { id: string }> {
    const now = new Date();
    const user: User = {
      ...userData,
      role: userData.role || 'user',
      createdAt: now,
      updatedAt: now
    };
    
    const id = await createDocument<User>(COLLECTION_NAME, user);
    return { id, ...user };
  },
  
  // Get a user by ID
  async findById(id: string): Promise<(User & { id: string }) | null> {
    return getDocument<User>(COLLECTION_NAME, id);
  },
  
  // Find a user by email
  async findByEmail(email: string): Promise<(User & { id: string }) | null> {
    const users = await getDocuments<User>(COLLECTION_NAME, {
      fieldPath: 'email',
      operator: '==',
      value: email
    });
    
    return users.length > 0 ? users[0] : null;
  },
  
  // Update a user
  async update(id: string, userData: Partial<User>): Promise<void> {
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };
    
    await updateDocument<User>(COLLECTION_NAME, id, updateData);
  },
  
  // Delete a user
  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTION_NAME, id);
  }
};

export default UserModel; 