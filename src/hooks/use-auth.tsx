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
  favorite_service_ids?: number[];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  userRole: 'seeker' | 'provider' | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
  updateUserFavorites: (serviceId: number, action: 'add' | 'remove') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'seeker' | 'provider' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthProvider: useEffect running on mount.');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setUserRole(parsedUser.role);
        console.log('AuthProvider: Found user in localStorage:', parsedUser.email);
      } catch (e) {
        console.error('AuthProvider: Failed to parse user from localStorage', e);
        localStorage.removeItem('currentUser');
      }
    } else {
      console.log('AuthProvider: No user found in localStorage.');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'ahmed.provider@example.com' && password === 'password123') {
      const loggedInUser: User = {
        id: 1,
        name: 'أحمد مقدم',
        email: 'ahmed.provider@example.com',
        role: 'provider',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
        favorite_service_ids: [],
      };
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setUserRole(loggedInUser.role);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      console.log('AuthProvider: User logged in and saved to localStorage:', loggedInUser.email);
      toast.success('تم تسجيل الدخول بنجاح (محاكاة)!');
      navigate('/dashboard');
    } else if (email === 'layla.seeker@example.com' && password === 'password123') {
      const loggedInUser: User = {
        id: 2,
        name: 'ليلى طالبة',
        email: 'layla.seeker@example.com',
        role: 'seeker',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
        favorite_service_ids: [],
      };
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setUserRole(loggedInUser.role);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      console.log('AuthProvider: User logged in and saved to localStorage:', loggedInUser.email);
      toast.success('تم تسجيل الدخول بنجاح (محاكاة)!');
      navigate('/client-home');
    } else {
      toast.error('فشل تسجيل الدخول (محاكاة): البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      console.error('AuthProvider: Login failed for email:', email);
      throw new Error('Invalid credentials');
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone,
      bio: userData.bio,
      avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name.split(' ').map(n => n[0]).join('')}`,
      favorite_service_ids: [],
    };

    setUser(newUser);
    setIsLoggedIn(true);
    setUserRole(newUser.role);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    console.log('AuthProvider: User signed up and saved to localStorage:', newUser.email);
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
    console.log('AuthProvider: User logged out and removed from localStorage.');
    toast.info('تم تسجيل الخروج.');
    navigate('/login');
  };

  const updateUserFavorites = async (serviceId: number, action: 'add' | 'remove') => {
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإدارة المفضلة.');
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    console.log('AuthProvider: User favorites updated and saved to localStorage.');
    toast.success(`تم ${action === 'add' ? 'إضافة' : 'إزالة'} الخدمة من المفضلة بنجاح!`);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, userRole, isLoading, login, signup, logout, updateUserFavorites }}>
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