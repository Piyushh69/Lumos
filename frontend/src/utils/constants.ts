export const API_BASE_URL = 'http://localhost:8000';

export const ROUTES = {
  DASHBOARD: '/',
  RESUME_UPLOAD: '/hr/resume-upload',
  CANDIDATES: '/hr/candidates',
  FLIGHT_SEARCH: '/travel/search',
} as const;

export const STATUS_COLORS = {
  new: '#3b82f6',
  screening: '#f59e0b',
  interview: '#8b5cf6',
  hired: '#10b981',
  rejected: '#ef4444',
} as const;