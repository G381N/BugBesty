export interface Project {
  id: string;
  name: string;
  targetDomain: string;
  status: string;
  owner: string;
  team?: string[];
  enumerationTaskId?: string;
  subdomainsCount?: number;
  vulnerabilitiesFound?: number;
  createdAt: string;
  updatedAt: string;
}