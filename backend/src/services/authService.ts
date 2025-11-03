import { supabase } from './supabase';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { User } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export interface SignupInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'manager' | 'bartender' | 'chef' | 'waiter' | 'support';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export const authService = {
  async signup(input: SignupInput): Promise<TokenResponse> {
    // Hash password
    const hashedPassword = await bcryptjs.hash(input.password, 10);

    // Create user in database
    const { data, error } = await supabase.from('users').insert([
      {
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
        role: input.role,
        password_hash: hashedPassword,
        is_active: true,
      },
    ]).select().single();

    if (error) {
      throw new Error(error.message);
    }

    // Generate tokens
    const tokens = this.generateTokens(data);
    return {
      ...tokens,
      user: data,
    };
  },

  async login(input: LoginInput): Promise<TokenResponse> {
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.email)
      .single();

    if (error || !user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(input.password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);
    return {
      ...tokens,
      user,
    };
  },

  generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400, // 24 hours in seconds
      token_type: 'Bearer',
    };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      const tokens = this.generateTokens(user);
      return {
        ...tokens,
        user,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  async getCurrentUser(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
