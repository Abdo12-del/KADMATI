import { User } from '../models/userModel';
import bcrypt from 'bcryptjs';

let users: User[] = [
  {
    id: 1,
    name: 'أحمد مقدم',
    email: 'ahmed.provider@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyza1234567890123456789012345678901234567890', // Hashed 'password123'
    role: 'provider',
    phone: '+966501234567',
    bio: 'مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    favorite_service_ids: [], // Initialize for existing users
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    name: 'ليلى طالبة',
    email: 'layla.seeker@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyza1234567890123456789012345678901234567890', // Hashed 'password123'
    role: 'seeker',
    phone: '+966557654321',
    bio: 'أبحث عن خدمات تصميم وتطوير لمشروعي الجديد.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
    favorite_service_ids: [], // Initialize for existing users
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Ensure all existing users have favorite_service_ids initialized
users = users.map(user => ({
  ...user,
  favorite_service_ids: user.favorite_service_ids || [],
}));

let nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;

export const userService = {
  async getAllUsers(): Promise<User[]> {
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  },

  async getUserById(id: number): Promise<User | undefined> {
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = users.find(u => u.email === email);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  },

  // New method to get user by email including password for authentication
  async getUserByEmailWithPassword(email: string): Promise<User | undefined> {
    return users.find(u => u.email === email);
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newUser: User = {
      id: nextUserId++,
      ...user,
      favorite_service_ids: [], // Initialize for new users
      created_at: new Date(),
      updated_at: new Date(),
    };
    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  },

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | undefined> {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      const updatedUser = {
        ...users[index],
        ...updates,
        updated_at: new Date(),
      };
      users[index] = updatedUser;
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword as User;
    }
    return undefined;
  },

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    return users.length < initialLength;
  },
};