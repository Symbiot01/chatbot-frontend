'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const storedUser = localStorage.getItem('medrecs_user');
      const storedToken = localStorage.getItem('access_token');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        // Clear any partial auth data
        localStorage.removeItem('medrecs_user');
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('medrecs_user');
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Import the API client dynamically to avoid SSR issues
      const { medrecsApi } = await import('@/lib/api-client');
      
      // Call the real API login endpoint
      const response = await medrecsApi.login(email, password);
      
      if (response.access_token) {
        const userData: User = {
          id: '1',
          email,
          name: email.split('@')[0],
        };
        
        localStorage.setItem('medrecs_user', JSON.stringify(userData));
        localStorage.setItem('access_token', response.access_token);
        setUser(userData);
      } else {
        throw new Error('Login failed - no token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Import the API client dynamically to avoid SSR issues
      const { medrecsApi } = await import('@/lib/api-client');
      medrecsApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('medrecs_user');
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
