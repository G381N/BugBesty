import { 
  createDocument, 
  getDocument, 
  getDocuments, 
  updateDocument,
  deleteDocument 
} from '@/lib/firestore';

// Define subdomain interface
export interface Subdomain {
  name: string;
  projectId: string;
  status: 'scanning' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const COLLECTION_NAME = 'subdomains';

// Subdomain model methods
export const SubdomainModel = {
  // Create a new subdomain
  async create(subdomainData: Omit<Subdomain, 'status' | 'createdAt' | 'updatedAt'>): Promise<Subdomain & { id: string }> {
    const now = new Date();
    const subdomain: Subdomain = {
      ...subdomainData,
      status: 'scanning',
      createdAt: now,
      updatedAt: now
    };
    
    const id = await createDocument<Subdomain>(COLLECTION_NAME, subdomain);
    return { id, ...subdomain };
  },
  
  // Get a subdomain by ID
  async findById(id: string): Promise<(Subdomain & { id: string }) | null> {
    return getDocument<Subdomain>(COLLECTION_NAME, id);
  },
  
  // Find subdomains by project
  async findByProject(projectId: string): Promise<(Subdomain & { id: string })[]> {
    return getDocuments<Subdomain>(COLLECTION_NAME, {
      fieldPath: 'projectId',
      operator: '==',
      value: projectId
    });
  },
  
  // Find subdomains by status
  async findByStatus(projectId: string, status: Subdomain['status']): Promise<(Subdomain & { id: string })[]> {
    // For Firestore, we need two separate query constraints, so we get all and filter
    const subdomains = await getDocuments<Subdomain>(COLLECTION_NAME, {
      fieldPath: 'projectId',
      operator: '==',
      value: projectId
    });
    
    return subdomains.filter(subdomain => subdomain.status === status);
  },
  
  // Update a subdomain
  async update(id: string, subdomainData: Partial<Subdomain>): Promise<void> {
    const updateData = {
      ...subdomainData,
      updatedAt: new Date()
    };
    
    await updateDocument<Subdomain>(COLLECTION_NAME, id, updateData);
  },
  
  // Delete a subdomain
  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTION_NAME, id);
  }
};

export default SubdomainModel; 