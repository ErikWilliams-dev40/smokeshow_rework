import { ComplianceText } from '@/components/compliance/ComplianceText'

import styles from './HempNotice.module.css'

/**
 * Site-wide hemp compliance notice. Mounted by the root layout so it sits below
 * every route's own content, including the splash footer, and never floats.
 */
export function HempNotice() {
  return (
    <footer className={styles.notice} aria-label="Hemp product notice">
      <div className={styles.inner}>
        <div className={styles.title}>
          <svg
            className={styles.shield}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <ComplianceText id="hempNoticeHeading" as="h2" className={styles.heading} />
        </div>
        <ComplianceText id="hempNotice" className={styles.body} />
      </div>
    </footer>
  )
}
