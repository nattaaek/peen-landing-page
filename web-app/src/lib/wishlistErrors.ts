import { PeenAPIError } from './peen-api/client'

export function wishlistErrorMessage(err: unknown): string {
  if (err instanceof PeenAPIError) {
    if (err.status === 401) return 'Session expired. Sign in again.'
    const msg = err.message.toLowerCase()
    if (msg.includes('route not found') || msg.includes('not found')) {
      return 'This route is no longer in the catalog.'
    }
    if (msg.includes('invalid uuid')) return 'Invalid route. Try refreshing the feed.'
    if (msg.includes('user_id mismatch')) return 'Account mismatch. Sign out and sign in again.'
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return 'Could not update wishlist. Try again.'
}
