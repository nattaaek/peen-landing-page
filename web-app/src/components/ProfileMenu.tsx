import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FeedUserAvatar } from './FeedUserAvatar'
import { Icon } from './Icon'
import { useAuth } from '../features/auth/AuthProvider'
import { profileDisplayName, profileHandle } from '../lib/peen-api/profiles'
import type { UserProfile } from '../types/api'

export function ProfileMenu({
  profile,
  onLog,
  onToast,
}: {
  profile: UserProfile | undefined
  onLog: () => void
  onToast?: (msg: string) => void
}) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const name = profile ? profileDisplayName(profile) : 'You'
  const handle = profile?.username ? profileHandle(profile) : ''

  return (
    <div className="profile-wrap" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        title={name}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <FeedUserAvatar
          name={name}
          avatarUrl={profile?.avatar_url}
          colorSeed={profile?.user_id}
          size={38}
        />
      </button>
      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-head">
            <FeedUserAvatar
              name={name}
              avatarUrl={profile?.avatar_url}
              colorSeed={profile?.user_id}
              size={40}
            />
            <div style={{ minWidth: 0 }}>
              <div className="profile-menu-name">{name}</div>
              {handle ? <div className="profile-menu-handle">{handle}</div> : null}
            </div>
          </div>
          <button
            type="button"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/profile')
            }}
          >
            <Icon name="profile" size={18} /> View profile
          </button>
          <button
            type="button"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLog()
            }}
          >
            <Icon name="plus" size={18} /> Log a climb
          </button>
          <button
            type="button"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onToast?.('Settings coming soon')
            }}
          >
            <Icon name="settings" size={18} /> Settings
          </button>
          <div className="profile-menu-divider" />
          <button
            type="button"
            className="profile-menu-item danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
          >
            <Icon name="upload" size={18} style={{ transform: 'rotate(90deg)' }} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
