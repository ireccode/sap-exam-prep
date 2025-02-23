import { vi } from 'vitest';
import { supabase } from '../../lib/supabaseClient';
import { handleWebhook } from '../../services/stripe/webhooks';
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';

type MockQueryBuilder = {
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  url: string;
  headers: Record<string, string>;
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      url: '',
      headers: {},
      insert: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn().mockReturnThis()
    })),
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('Stripe Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Webhook Handling', () => {
    it('processes checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            client_reference_id: 'user_123'
          }
        }
      };

      const mockUpdateResponse = { data: { id: 'user_123' }, error: null };
      const mockUpdateFn = vi.fn().mockResolvedValue(mockUpdateResponse);
      const mockFromFn = vi.fn(() => ({
        update: mockUpdateFn,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        url: '',
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn().mockReturnThis()
      })) as unknown as (relation: string) => MockQueryBuilder;

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      await handleWebhook(mockEvent);

      // Verify profile update
      expect(mockFromFn).toHaveBeenCalledWith('profiles');
      expect(mockUpdateFn).toHaveBeenCalledWith({
        is_premium: true
      });
    });

    it('processes customer.subscription.updated event', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            cancel_at_period_end: false
          }
        }
      };

      const mockUpdateResponse = { data: { id: 'sub_123' }, error: null };
      const mockUpdateFn = vi.fn().mockResolvedValue(mockUpdateResponse);
      const mockFromFn = vi.fn(() => ({
        update: mockUpdateFn,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        url: '',
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn().mockReturnThis()
      })) as unknown as (relation: string) => MockQueryBuilder;

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      await handleWebhook(mockEvent);

      // Verify subscription status update
      expect(mockFromFn).toHaveBeenCalledWith('subscriptions');
      expect(mockUpdateFn).toHaveBeenCalledWith({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: expect.any(String)
      });
    });
  });

  describe('Subscription Flow', () => {
    it('updates profile after successful subscription', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            client_reference_id: 'user_123'
          }
        }
      };

      const mockUpdateResponse = { data: { id: 'user_123' }, error: null };
      const mockUpdateFn = vi.fn().mockResolvedValue(mockUpdateResponse);
      const mockFromFn = vi.fn(() => ({
        update: mockUpdateFn,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        url: '',
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn().mockReturnThis()
      })) as unknown as (relation: string) => MockQueryBuilder;

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      await handleWebhook(mockEvent);

      // Verify profile is updated
      expect(mockFromFn).toHaveBeenCalledWith('profiles');
      expect(mockUpdateFn).toHaveBeenCalledWith({
        is_premium: true
      });
    });

    it('handles subscription cancellation', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123'
          }
        }
      };

      const mockUpdateResponse = { data: { id: 'user_123' }, error: null };
      const mockUpdateFn = vi.fn().mockResolvedValue(mockUpdateResponse);
      const mockFromFn = vi.fn(() => ({
        update: mockUpdateFn,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        url: '',
        headers: {},
        insert: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn().mockReturnThis()
      })) as unknown as (relation: string) => MockQueryBuilder;

      vi.mocked(supabase.from).mockImplementation(mockFromFn);

      await handleWebhook(mockEvent);

      // Verify profile is updated
      expect(mockFromFn).toHaveBeenCalledWith('profiles');
      expect(mockUpdateFn).toHaveBeenCalledWith({
        is_premium: false
      });
    });
  });
}); 