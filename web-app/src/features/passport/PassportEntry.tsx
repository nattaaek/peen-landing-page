import { Link } from 'react-router-dom'
export function PassportEntry({ compact = false }: Readonly<{ compact?: boolean }>) {
  return <Link className={`passport-entry ${compact ? 'compact' : ''}`} to="/passport">
    <img src={`${import.meta.env.BASE_URL}passport/cover.png`} alt="" />
    <span><span className="wordmark">The climbing passport</span><strong>Good routes. A book of your own.</strong>
      {!compact && <span className="footnote">Explore the 3D passport and your seasonal route collection.</span>}</span>
    <span className="passport-entry-arrow" aria-hidden="true">↗</span>
  </Link>
}
