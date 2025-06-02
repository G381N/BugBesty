import { 
  createDocument, 
  getDocument, 
  getDocuments, 
  updateDocument,
  deleteDocument 
} from '@/lib/firestore';

// Define training content interface
export interface TrainingContent {
  name: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  impact: string[];
  prevention: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const COLLECTION_NAME = 'trainingContent';

// TrainingContent model methods
export const TrainingContentModel = {
  // Create new training content
  async create(contentData: Omit<TrainingContent, 'createdAt' | 'updatedAt'>): Promise<TrainingContent & { id: string }> {
    const now = new Date();
    const content: TrainingContent = {
      ...contentData,
      createdAt: now,
      updatedAt: now
    };
    
    const id = await createDocument<TrainingContent>(COLLECTION_NAME, content);
    return { id, ...content };
  },
  
  // Get training content by ID
  async findById(id: string): Promise<(TrainingContent & { id: string }) | null> {
    return getDocument<TrainingContent>(COLLECTION_NAME, id);
  },
  
  // Find training content by category
  async findByCategory(category: string): Promise<(TrainingContent & { id: string })[]> {
    return getDocuments<TrainingContent>(COLLECTION_NAME, {
      fieldPath: 'category',
      operator: '==',
      value: category
    });
  },
  
  // Get all training content
  async findAll(): Promise<(TrainingContent & { id: string })[]> {
    return getDocuments<TrainingContent>(COLLECTION_NAME);
  },
  
  // Update training content
  async update(id: string, contentData: Partial<TrainingContent>): Promise<void> {
    const updateData = {
      ...contentData,
      updatedAt: new Date()
    };
    
    await updateDocument<TrainingContent>(COLLECTION_NAME, id, updateData);
  },
  
  // Delete training content
  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTION_NAME, id);
  }
};

export default TrainingContentModel; 