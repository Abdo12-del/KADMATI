"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  avatar_url?: string;
  phone?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  userRole: 'seeker' | 'provider' | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'seeker' | 'provider' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for user data in localStorage on mount
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoggedIn(true);
      setUserRole(parsedUser.role);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تسجيل الدخول.');
      }

      const result = await response.json();
      const loggedInUser: User = result.data;

      setUser(loggedInUser);
      setIsLoggedIn(true);
      setUserRole(loggedInUser.role);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      toast.success('تم تسجيل الدخول بنجاح!');

      if (loggedInUser.role === 'provider') {
        navigate('/dashboard');
      } else {
        navigate('/client-home');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول.');
      console.error('Login error:', error);
      throw error; // Re-throw to allow component to handle
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إنشاء الحساب.');
      }

      const result = await response.json();
      const newUser: User = result.data;

      // Automatically log in the user after successful signup
      setUser(newUser);
      setIsLoggedIn(true);
      setUserRole(newUser.role);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      toast.success('تم إنشاء الحساب وتسجيل الدخول بنجاح!');

      if (newUser.role === 'provider') {
        navigate('/dashboard');
      } else {
        navigate('/client-home');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب.');
      console.error('Signup error:', error);
      throw error; // Re-throw to allow component to handle
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('currentUser');
    toast.info('تم تسجيل الخروج.');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, userRole, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};