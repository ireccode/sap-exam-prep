import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type UserRecord = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async createInitialUser(userData: UserInsert): Promise<UserRecord> {
    try {
      console.log('Creating initial user record:', userData);

      if (!userData.id) {
        throw new Error('User ID is required');
      }

      const now = new Date().toISOString();
      const userRecord: UserInsert = {
        id: userData.id,
        email: userData.email,
        credits: userData.credits ?? 0,
        web_ui_enabled: userData.web_ui_enabled ?? false,
        role: userData.role || 'user',
        created_at: userData.created_at || now,
        updated_at: now
      };

      console.log('Prepared initial user record:', userRecord);

      const { data, error } = await this.supabase
        .from('users')
        .insert([userRecord])
        .select()
        .single();

      if (error) {
        console.error('Error creating initial user:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from create operation');
      }

      console.log('Successfully created initial user:', data);
      return data;
    } catch (error) {
      console.error('Error in createInitialUser:', error);
      throw error;
    }
  }

  async upsertUser(userData: UserUpdate): Promise<UserRecord> {
    try {
      console.log('Upserting user record:', userData);

      if (!userData.id) {
        throw new Error('User ID is required');
      }

      const now = new Date().toISOString();
      const userRecord: UserUpdate = {
        ...userData,
        updated_at: now
      };

      console.log('Prepared user record for upsert:', userRecord);

      const { data, error } = await this.supabase
        .from('users')
        .upsert([userRecord])
        .select()
        .single();

      if (error) {
        console.error('Error upserting user:', error);
        if (error.code === '42501') {
          throw new Error('Permission denied: Check RLS policies');
        }
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from upsert operation');
      }

      console.log('Successfully upserted user:', data);
      return data;
    } catch (error) {
      console.error('Error in upsertUser:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    try {
      console.log('Fetching user record for ID:', id);

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }

      console.log('Fetched user record:', data);
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  }
}

export type { UserRecord, UserInsert, UserUpdate }; 