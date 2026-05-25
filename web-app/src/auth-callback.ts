import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  document.body.innerHTML =
    '<p>Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>'
} else {
  const supabase = createClient(url, key)
  supabase.auth
    .exchangeCodeForSession(window.location.href)
    .then(({ error }) => {
      if (error) {
        document.body.innerHTML = `<p>Sign-in failed. <a href="/app/">Back to peen</a></p>`
        console.error(error)
        return
      }
      window.location.replace('/app/')
    })
    .catch((err) => {
      console.error(err)
      document.body.innerHTML = `<p>Sign-in failed. <a href="/app/">Back to peen</a></p>`
    })
}
