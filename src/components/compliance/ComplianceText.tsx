import { compliance, type ComplianceKey } from '@/content/compliance'

type Props = {
  id: ComplianceKey
  className?: string
  /** Element to render. Compliance copy is sometimes a heading, not a paragraph. */
  as?: 'p' | 'h2'
}

/** The only way compliance copy reaches the page. Styling is the caller's. */
export function ComplianceText({ id, className, as: Tag = 'p' }: Props) {
  return <Tag className={className}>{compliance[id]}</Tag>
}
