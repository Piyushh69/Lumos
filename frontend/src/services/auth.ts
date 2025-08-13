export const authService = {
  login: async (credentials: any) => {
    // Login implementation
    return { success: true, token: 'mock-token' };
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: () => {
    return localStorage.getItem('token');
  },
};