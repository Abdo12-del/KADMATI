"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  favorite_service_ids?: number[]; // Added to User interface
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  userRole: 'seeker' | 'provider' | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
  updateUserFavorites: (serviceId: number, action: 'add' | 'remove') => Promise<void>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }: { ReactNode }) => {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
      console.error('Signup failed:', error);
      throw error;
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

  const updateUserFavorites = async (serviceId: number, action: 'add' | 'remove') => {
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإدارة المفضلة.');
      return;
    }

    let response;
    let method;
    let url;

    if (action === 'add') {
      method = 'POST';
      url = `${API_BASE_URL}/api/users/${user.id}/favorites`;
      response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
    } else { // action === 'remove'
      method = 'DELETE';
      url = `${API_BASE_URL}/api/users/${user.id}/favorites/${serviceId}`;
      response = await fetch(url, { method });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `فشل ${action === 'add' ? 'إضافة' : 'إزالة'} الخدمة من المفضلة.`);
    }

    const updatedUserData = await response.json();
    const updatedUser = updatedUserData.data;

    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    toast.success(`تم ${action === 'add' ? 'إضافة' : 'إزالة'} الخدمة من المفضلة بنجاح!`);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, userRole, login, signup, logout, updateUserFavorites }}>
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