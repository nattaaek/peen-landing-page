import type { Session } from '@supabase/supabase-js'

const DEV_USER_ID = '00000000-0000-4000-8000-000000000001'

export function isDevAuthBypassEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
}

/** Local-only session when Supabase is not configured or bypass flag is set. */
export function createDevAuthSession(): Session {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: 'dev-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'dev-refresh-token',
    user: {
      id: DEV_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'dev@peen.local',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { nickname: 'Dev Climber' },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    },
  } as Session
}
