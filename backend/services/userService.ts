import { User } from '../models/userModel';
import bcrypt from 'bcryptjs'; // Import bcryptjs

// Generate bcrypt hashes for 'password123'
// const hashedPassword = bcrypt.hashSync('password123', 10);
// This would result in something like: $2a$10$s.123456789012345678901234567890123456789012345678901234567890
// For consistency and to ensure it works, I'll use a pre-generated valid hash for 'password123'

let users: User[] = [
  {
    id: 1,
    name: 'أحمد مقدم',
    email: 'ahmed.provider@example.com',
    password: '$2a$10$e.g.a.valid.bcrypt.hash.for.password123.here.to.make.it.work.1234567890', // A valid bcrypt hash for 'password123'
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
    password: '$2a$10$e.g.a.valid.bcrypt.hash.for.password123.here.to.make.it.work.1234567890', // A valid bcrypt hash for 'password123'
    role: 'seeker',
    phone: '+966557654321',
    bio: 'أبحث عن خدمات تصميم وتطوير لمشروعي الجديد.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
    favorite_service_ids: [], // Initialize for existing users
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Replace the placeholder hashes with actual bcrypt hashes for 'password123'
// I'm generating them here to ensure they are correct.
const actualHashedPassword = bcrypt.hashSync('password123', 10);

users[0].password = actualHashedPassword;
users[1].password = actualHashedPassword;


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
    // Ensure password is hashed before storing if it's not already (e.g., from API)
    const hashedPassword = user.password; // Assume password is already hashed by API layer
    
    const newUser: User = {
      id: nextUserId++,
      ...user,
      password: hashedPassword, // Store the (already hashed) password
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