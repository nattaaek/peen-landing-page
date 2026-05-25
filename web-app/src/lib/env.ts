function envVar(name: keyof ImportMetaEnv, fallback = ''): string {
  const v = import.meta.env[name]
  if (typeof v === 'string' && v.length > 0) return v
  return fallback
}

export const env = {
  supabaseUrl: () => envVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: () => envVar('VITE_SUPABASE_ANON_KEY'),
  peenApiUrl: () => envVar('VITE_PEEN_API_URL', 'https://api.peen.app').replace(/\/$/, ''),
  isConfigured: () =>
    Boolean(envVar('VITE_SUPABASE_URL') && envVar('VITE_SUPABASE_ANON_KEY')),
}
