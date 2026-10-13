import type { PassportEdition } from '../../lib/challengeIntro'

/** The cover's lockup: "Poda |" over "Best routes" with an italic last word, then the orange rule. */
export function EditionName({ edition, as: Tag = 'h2' }: Readonly<{ edition: PassportEdition; as?: 'h1' | 'h2' | 'strong' }>) {
  const lastSpace = edition.program.lastIndexOf(' ')
  return <>
    <Tag className="seasonal-edition-name">
      <span className="seasonal-edition-publisher">{edition.publisher} |</span>{' '}
      {edition.program.slice(0, lastSpace)} <em>{edition.program.slice(lastSpace + 1)}</em>
    </Tag>
    <span className="seasonal-edition-rule" aria-hidden="true" />
  </>
}
