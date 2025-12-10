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
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'ahmed.provider@example.com' && password === 'password123') {
      const loggedInUser: User = {
        id: 1,
        name: 'أحمد مقدم',
        email: 'ahmed.provider@example.com',
        role: 'provider',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
      };
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setUserRole(loggedInUser.role);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      toast.success('تم تسجيل الدخول بنجاح (محاكاة)!');
      navigate('/dashboard');
    } else if (email === 'layla.seeker@example.com' && password === 'password123') {
      const loggedInUser: User = {
        id: 2,
        name: 'ليلى طالبة',
        email: 'layla.seeker@example.com',
        role: 'seeker',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
      };
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setUserRole(loggedInUser.role);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      toast.success('تم تسجيل الدخول بنجاح (محاكاة)!');
      navigate('/client-home');
    } else {
      toast.error('فشل تسجيل الدخول (محاكاة): البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      throw new Error('Invalid credentials');
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate successful signup
    const newUser: User = {
      id: Date.now(), // Generate a unique ID
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone,
      bio: userData.bio,
      avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name.split(' ').map(n => n[0]).join('')}`,
    };

    setUser(newUser);
    setIsLoggedIn(true);
    setUserRole(newUser.role);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    toast.success('تم إنشاء الحساب وتسجيل الدخول بنجاح (محاكاة)!');

    if (newUser.role === 'provider') {
      navigate('/dashboard');
    } else {
      navigate('/client-home');
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