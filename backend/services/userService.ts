import { User } from '../models/userModel';
import bcrypt from 'bcryptjs';

let users: User[] = [
  {
    id: 1,
    name: 'أحمد مقدم',
    email: 'ahmed.provider@example.com',
    password: 'password123', // Store plain text password for simulation
    role: 'provider',
    phone: '+966501234567',
    bio: 'مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    favorite_service_ids: [], // Initialize for existing users
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
  },
  {
    id: 2,
    name: 'ليلى طالبة',
    email: 'layla.seeker@example.com',
    password: 'password123', // Store plain text password for simulation
    role: 'seeker',
    phone: '+966557654321',
    bio: 'أبحث عن خدمات تصميم وتطوير لمشروعي الجديد.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
    favorite_service_ids: [1, 3], // Laila's favorite services
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
  },
  {
    id: 3,
    name: 'خالد عميل',
    email: 'khalid.client@example.com',
    password: 'password123',
    role: 'seeker',
    phone: '+966512345678',
    bio: 'أحتاج لخدمات صيانة منزلية بشكل دوري.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=KC',
    favorite_service_ids: [],
    created_at: new Date('2023-02-10T00:00:00Z'),
    updated_at: new Date('2023-02-10T00:00:00Z'),
  },
  {
    id: 4,
    name: 'فاطمة مقدمة',
    email: 'fatima.provider@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+966598765432',
    bio: 'متخصصة في خدمات التنظيف العميق للمنازل والمكاتب.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=FP',
    favorite_service_ids: [],
    created_at: new Date('2023-03-05T00:00:00Z'),
    updated_at: new Date('2023-03-05T00:00:00Z'),
  },
];

// Ensure all existing users have favorite_service_ids initialized
users = users.map(user => ({
  ...user,
  favorite_service_ids: user.favorite_service_ids || [],
}));

let nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;

export const userService = {
  async getAllUsers(): Promise<Omit<User, 'password'>[]> { // Changed return type to omit password
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  async getUserById(id: number): Promise<Omit<User, 'password'> | undefined> { // Changed return type to omit password
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  },

  async getUserByEmail(email: string): Promise<Omit<User, 'password'> | undefined> { // Changed return type to omit password
    const user = users.find(u => u.email === email);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  },

  // New method to get user by email including password for authentication
  async getUserByEmailWithPassword(email: string): Promise<User | undefined> { // This method should return the full User object
    return users.find(u => u.email === email);
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<Omit<User, 'password'>> { // Changed return type to omit password
    const newUser: User = {
      id: nextUserId++,
      ...user,
      favorite_service_ids: [], // Initialize for new users
      created_at: new Date(),
      updated_at: new Date(),
    };
    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<Omit<User, 'password'> | undefined> { // Changed return type to omit password
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      const updatedUser = {
        ...users[index],
        ...updates,
        updated_at: new Date(),
      };
      users[index] = updatedUser;
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }
    return undefined;
  },

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    return users.length < initialLength;
  },
};