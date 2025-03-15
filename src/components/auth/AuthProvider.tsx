import { createBrowserClient } from '@supabase/ssr';
import { AuthProvider } from './AuthContext';

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  return (
    <AuthProvider supabaseClient={supabase}>
      {children}
    </AuthProvider>
  );
} 