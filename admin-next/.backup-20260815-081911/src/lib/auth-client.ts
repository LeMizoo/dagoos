// src/lib/auth-client.ts - Gestion de l'authentification côté client
import { apiFetch } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const authClient = {
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
  
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('🔐 Tentative de connexion pour:', email);
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('📡 Réponse status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de connexion');
      }
      const data: LoginResponse = await response.json();
      console.log('✅ Connexion réussie pour:', data.user.name);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  },
  
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  
  verify: async (): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/auth/verify');
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default authClient;
