import { useCallback, useState } from 'react'
import { useAddComment, useComments, useMyProfile } from '../../hooks/useMigration'
import { FeedUserAvatar } from '../../components/FeedUserAvatar'
import { useAuth } from '../auth/AuthProvider'
import { formatWhen } from '../../lib/formatWhen'
import { profileDisplayName } from '../../lib/peen-api/profiles'
import { isCommentLiked, toggleCommentLike } from '../../lib/commentLikes'

export function FeedInlineComments({
  climbId,
  onSignIn,
}: {
  climbId: string
  onSignIn: (msg?: string) => void
}) {
  const { accessToken } = useAuth()
  const profileQ = useMyProfile()
  const commentsQ = useComments(climbId)
  const addComment = useAddComment()
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; handle: string } | null>(null)
  const [postError, setPostError] = useState<string | null>(null)
  const [, bumpLikes] = useState(0)

  const refreshLikes = useCallback(() => bumpLikes((n) => n + 1), [])

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!accessToken) {
      onSignIn('Sign in to comment.')
      return
    }
    const body = draft.trim()
    if (!body) return
    setPostError(null)
    try {
      await addComment.mutateAsync({ climb_id: climbId, body })
      setDraft('')
      setReplyTo(null)
    } catch {
      setPostError('Could not post comment. Try again.')
    }
  }

  const meName = profileDisplayName(profileQ.data ?? {})

  const startReply = (commentId: string, authorName: string, username?: string | null) => {
    if (!accessToken) {
      onSignIn('Sign in to reply.')
      return
    }
    const handle = username?.trim() ? `@${username.trim()}` : `@${authorName.replace(/\s+/g, '').toLowerCase()}`
    setReplyTo({ id: commentId, handle })
    setDraft(`${handle} `)
  }

  const toggleLike = (commentId: string) => {
    if (!accessToken) {
      onSignIn('Sign in to like comments.')
      return
    }
    toggleCommentLike(commentId)
    refreshLikes()
  }

  return (
    <div className="feed-comments">
      <div className="feed-comments-list">
        {commentsQ.isLoading ? (
          <>
            <div className="feed-comment-skeleton" aria-hidden />
            <div className="feed-comment-skeleton" aria-hidden />
          </>
        ) : null}
        {(commentsQ.data ?? []).map((c) => {
          const authorName = profileDisplayName(c.profile ?? {})
          const liked = isCommentLiked(c.id)
          return (
            <div key={c.id} className="feed-comment-row">
              <FeedUserAvatar
                name={authorName}
                avatarUrl={c.profile?.avatar_url}
                colorSeed={c.user_id}
                size={28}
              />
              <div className="feed-comment-body-wrap">
                <div className="feed-comment-bubble">
                  <div className="feed-comment-author">{authorName}</div>
                  <div className="feed-comment-text">{c.body}</div>
                </div>
                <div className="feed-comment-meta">
                  <span>{formatWhen(c.created_at)}</span>
                  <button
                    type="button"
                    className="feed-comment-action"
                    onClick={() =>
                      startReply(c.id, authorName, c.profile?.username)
                    }
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    className={`feed-comment-action ${liked ? 'active' : ''}`}
                    onClick={() => toggleLike(c.id)}
                  >
                    {liked ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {!commentsQ.isLoading && (commentsQ.data ?? []).length === 0 ? (
          <p className="muted" style={{ fontSize: 13, margin: '0 0 8px' }}>
            No comments yet.
          </p>
        ) : null}
      </div>
      {replyTo && (
        <div className="feed-comment-replying">
          <span className="muted">Replying</span>
          <button
            type="button"
            className="feed-comment-action"
            onClick={() => {
              setReplyTo(null)
              setDraft('')
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <form className="feed-comment-form" onSubmit={submit}>
        <FeedUserAvatar
          name={meName}
          avatarUrl={profileQ.data?.avatar_url}
          colorSeed={profileQ.data?.user_id}
          size={28}
        />
        <label className="search feed-comment-input">
          <input
            placeholder={
              accessToken
                ? replyTo
                  ? `Reply to ${replyTo.handle}…`
                  : 'Add a comment…'
                : 'Sign in to add a comment…'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              if (!accessToken) {
                e.target.blur()
                onSignIn('Sign in to comment.')
              }
            }}
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary feed-comment-post"
          disabled={!draft.trim() || addComment.isPending}
        >
          {addComment.isPending ? 'Posting…' : 'Post'}
        </button>
      </form>
      {postError ? (
        <p className="error" style={{ marginTop: 8, fontSize: 13 }} role="alert">
          {postError}
        </p>
      ) : null}
    </div>
  )
}
