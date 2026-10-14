import { compliance, type ComplianceKey } from '@/content/compliance'

type Props = {
  id: ComplianceKey
  className?: string
}

/** The only way compliance copy reaches the page. Styling is the caller's. */
export function ComplianceText({ id, className }: Props) {
  return <p className={className}>{compliance[id]}</p>
}
