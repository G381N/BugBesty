export interface IVulnerability {
  id?: string;
  status: 'Not Yet Done' | 'Found' | 'Not Found';
  subdomainId: string;
  type?: string;
  notes?: string;
}

export interface ISubdomain {
  id?: string;
  name: string;
  status: 'pending' | 'completed';
  projectId: string;
}

export interface IProject {
  id?: string;
  name: string;
  description?: string;
  owner: string;
  team?: string[];
  targetDomain?: string;
  status?: string;
  enumerationTaskId?: string;
  subdomainsCount?: number;
  vulnerabilitiesFound?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  id?: string;
  email: string;
  password?: string;
  name?: string;
  role?: string;
}

export type ApiError = {
  error: string;
  status?: number;
} 