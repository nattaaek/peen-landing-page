/** Shared auth settings for the SPA and /auth/callback (PKCE + same storage key). */
export const supabaseAuthOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
  flowType: 'pkce' as const,
}
