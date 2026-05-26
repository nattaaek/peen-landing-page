import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { useAddComment, useComments } from '../../hooks/useMigration'
import type { FeedClimbRow } from '../../types/api'

export function CommentsSheet({
  post,
  open,
  onClose,
}: {
  post: FeedClimbRow | null
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const commentsQ = useComments(post?.id)
  const addComment = useAddComment()

  if (!open || !post) return null

  const submit = async () => {
    const body = text.trim()
    if (!body) return
    await addComment.mutateAsync({ climb_id: post.id, body })
    setText('')
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover" role="dialog" style={{ maxWidth: 420 }}>
        <div className="slideover-head">
          <strong>Comments</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="slideover-body" style={{ padding: 16 }}>
          <ul className="comment-list">
            {(commentsQ.data ?? []).map((c) => (
              <li key={c.id}>
                <p style={{ margin: 0, lineHeight: 1.45 }}>{c.body}</p>
                <span className="muted" style={{ fontSize: 11 }}>
                  {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                </span>
              </li>
            ))}
            {!commentsQ.isLoading && (commentsQ.data ?? []).length === 0 && (
              <p className="muted">No comments yet.</p>
            )}
          </ul>
          <label className="field" style={{ marginTop: 16 }}>
            <span>Add a comment</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={addComment.isPending || !text.trim()}
            onClick={() => submit()}
          >
            {addComment.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </>
  )
}
