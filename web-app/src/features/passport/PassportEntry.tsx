import { Link } from 'react-router-dom'
import { CT_CLASSICS_EDITION } from '../../lib/challengeIntro'
import { EditionName } from './EditionName'
export function PassportEntry({ compact = false }: Readonly<{ compact?: boolean }>) {
  return <Link className={`passport-entry ${compact ? 'compact' : ''}`} to="/passport"
    aria-label={`Open the ${CT_CLASSICS_EDITION.name} passport, ${CT_CLASSICS_EDITION.edition}`}>
    <img src={`${import.meta.env.BASE_URL}passport/cover.png`} width={720} height={1024} alt="" />
    <span className="passport-entry-copy"><span className="seasonal-edition-kicker">Passport · {CT_CLASSICS_EDITION.edition}</span>
      <EditionName edition={CT_CLASSICS_EDITION} as="strong" />
      {!compact && <span className="footnote">Explore the 3D passport and your seasonal route collection.</span>}</span>
    <span className="passport-entry-arrow" aria-hidden="true">↗</span>
  </Link>
}
