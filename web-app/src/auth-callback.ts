import { createClient } from '@supabase/supabase-js'
import { supabaseAuthOptions } from './lib/supabase-auth-options'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function showError(message: string) {
  document.body.innerHTML = `<p>${message}</p><p><a href="/app/">Back to peen</a></p>`
}

if (!url || !key) {
  showError('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
} else {
  const params = new URLSearchParams(window.location.search)
  const oauthError = params.get('error_description') ?? params.get('error')
  if (oauthError) {
    showError(`Sign-in was cancelled or denied. (${oauthError})`)
  } else {
    const code = params.get('code')
    if (!code) {
      showError('Sign-in link is missing a code. Try signing in again from the app.')
    } else {
      const supabase = createClient(url, key, { auth: supabaseAuthOptions })
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error(error)
            const hint =
              error.message.includes('code verifier') || error.message.includes('PKCE')
                ? ' Open peen at /app/, sign in again, and complete Google in the same browser tab.'
                : ''
            showError(`Sign-in failed: ${error.message}.${hint}`)
            return
          }
          window.location.replace('/app/')
        })
        .catch((err: unknown) => {
          console.error(err)
          showError('Sign-in failed unexpectedly. Try again from the app.')
        })
    }
  }
}
