import { browserInvitationSession } from './lib/invitationBootstrap'
import { createClient } from '@supabase/supabase-js'
import { supabaseAuthOptions } from './lib/supabase-auth-options'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function showError() {
  const message = document.createElement('p')
  message.textContent = 'Sign-in could not be completed. Return to peen and try signing in again in this same browser tab.'
  const recovery = document.createElement('p')
  const link = document.createElement('a')
  link.textContent = 'Back to peen'
  link.href = browserInvitationSession.returnPath()
  recovery.append(link)
  document.body.replaceChildren(message, recovery)
}

if (!url || !key) {
  showError()
} else {
  const params = new URLSearchParams(window.location.search)
  const oauthError = params.get('error_description') ?? params.get('error')
  if (oauthError) {
    showError()
  } else {
    const code = params.get('code')
    if (!code) {
      showError()
    } else {
      Promise.resolve()
        .then(() => createClient(url, key, { auth: supabaseAuthOptions })
          .auth.exchangeCodeForSession(code))
        .then(({ data, error }) => {
          if (error || !data.session) {
            showError()
            return
          }
          browserInvitationSession.observeAccount(data.session.user.id)
          window.location.replace(browserInvitationSession.returnPath())
        })
        .catch(() => {
          showError()
        })
    }
  }
}
