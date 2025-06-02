import { 
  createDocument, 
  getDocument, 
  getDocuments, 
  updateDocument,
  deleteDocument 
} from '@/lib/firestore';

// Define project interface
export interface Project {
  name: string;
  targetDomain: string;
  owner: string; // User ID in Firestore
  team: string[]; // Array of User IDs
  status: 'initializing' | 'active' | 'archived' | 'deleting';
  enumerationTaskId?: string;
  deletionTaskId?: string;
  subdomainsCount: number;
  vulnerabilitiesFound: number;
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const COLLECTION_NAME = 'projects';

// Project model methods
export const ProjectModel = {
  // Create a new project
  async create(projectData: Omit<Project, 'subdomainsCount' | 'vulnerabilitiesFound' | 'createdAt' | 'updatedAt'>): Promise<Project & { id: string }> {
    const now = new Date();
    const project: Project = {
      ...projectData,
      status: projectData.status || 'active',
      subdomainsCount: 0,
      vulnerabilitiesFound: 0,
      createdAt: now,
      updatedAt: now
    };
    
    const id = await createDocument<Project>(COLLECTION_NAME, project);
    return { id, ...project };
  },
  
  // Get a project by ID
  async findById(id: string): Promise<(Project & { id: string }) | null> {
    return getDocument<Project>(COLLECTION_NAME, id);
  },
  
  // Find projects by owner
  async findByOwner(ownerId: string): Promise<(Project & { id: string })[]> {
    return getDocuments<Project>(COLLECTION_NAME, {
      fieldPath: 'owner',
      operator: '==',
      value: ownerId
    });
  },
  
  // Find projects by team member
  async findByTeamMember(userId: string): Promise<(Project & { id: string })[]> {
    return getDocuments<Project>(COLLECTION_NAME, {
      fieldPath: 'team',
      operator: 'array-contains',
      value: userId
    });
  },
  
  // Update a project
  async update(id: string, projectData: Partial<Project>): Promise<void> {
    const updateData = {
      ...projectData,
      updatedAt: new Date()
    };
    
    await updateDocument<Project>(COLLECTION_NAME, id, updateData);
  },
  
  // Delete a project
  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTION_NAME, id);
  }
};

export default ProjectModel; 