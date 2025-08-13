export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  status: 'draft' | 'active' | 'closed';
  createdDate: string;
}