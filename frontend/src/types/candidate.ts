export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: number;
  status: 'new' | 'screening' | 'interview' | 'hired' | 'rejected';
}

export interface CandidateApplication {
  id: number;
  candidateId: number;
  jobId: number;
  status: string;
  appliedDate: string;
}