import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService, UserRecord } from '@/services/UserService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  const mockUser: UserRecord = {
    id: 'test-user-id',
    email: 'test@example.com',
    credits: 0,
    web_ui_enabled: false,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService(supabase);
  });

  describe('createInitialUser', () => {
    it('should create a new user record', async () => {
      const mockResponse = { data: mockUser, error: null };
      const fromSpy = vi.spyOn(supabase, 'from');
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue(mockResponse);

      fromSpy.mockReturnValue({
        insert: insertSpy,
        select: selectSpy,
        single: singleSpy,
      } as any);

      const result = await userService.createInitialUser({
        id: mockUser.id,
        email: mockUser.email,
      });

      expect(fromSpy).toHaveBeenCalledWith('users');
      expect(insertSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
      expect(singleSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle errors during creation', async () => {
      const mockError = new Error('Database error');
      const fromSpy = vi.spyOn(supabase, 'from');
      fromSpy.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(userService.createInitialUser({
        id: mockUser.id,
        email: mockUser.email,
      })).rejects.toThrow();
    });
  });

  describe('upsertUser', () => {
    it('should update an existing user record', async () => {
      const mockResponse = { data: mockUser, error: null };
      const fromSpy = vi.spyOn(supabase, 'from');
      const upsertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue(mockResponse);

      fromSpy.mockReturnValue({
        upsert: upsertSpy,
        select: selectSpy,
        single: singleSpy,
      } as any);

      const result = await userService.upsertUser({
        id: mockUser.id,
        email: mockUser.email,
      });

      expect(fromSpy).toHaveBeenCalledWith('users');
      expect(upsertSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
      expect(singleSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle errors during upsert', async () => {
      const mockError = new Error('Database error');
      const fromSpy = vi.spyOn(supabase, 'from');
      fromSpy.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(userService.upsertUser({
        id: mockUser.id,
        email: mockUser.email,
      })).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should fetch a user record by ID', async () => {
      const mockResponse = { data: mockUser, error: null };
      const fromSpy = vi.spyOn(supabase, 'from');
      const selectSpy = vi.fn().mockReturnThis();
      const eqSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue(mockResponse);

      fromSpy.mockReturnValue({
        select: selectSpy,
        eq: eqSpy,
        single: singleSpy,
      } as any);

      const result = await userService.getUserById(mockUser.id);

      expect(fromSpy).toHaveBeenCalledWith('users');
      expect(selectSpy).toHaveBeenCalledWith('*');
      expect(eqSpy).toHaveBeenCalledWith('id', mockUser.id);
      expect(singleSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle errors when fetching user', async () => {
      const mockError = new Error('Database error');
      const fromSpy = vi.spyOn(supabase, 'from');
      fromSpy.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(userService.getUserById(mockUser.id)).rejects.toThrow();
    });
  });
}); 