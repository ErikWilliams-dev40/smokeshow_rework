import Link from 'next/link'

import { confirmAge } from '@/server/session/gate-actions'

import { ComplianceText } from './ComplianceText'
import styles from './AgeGate.module.css'

type Props = {
  /** True after the visitor chose "Exit". */
  declined: boolean
}

/**
 * The trade-only doorway (handoff screen 1d), re-expressed for the splash.
 * "Enter" posts to a server action, so it works without client JavaScript.
 */
export function AgeGate({ declined }: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="gate-title">
        <div>
          <p className={styles.wordmark}>
            <span className={styles.cyan}>Smoke</span>{' '}
            <span className={styles.pink}>Show</span> Labs
          </p>
          <div className={styles.rule} aria-hidden="true">
            <span />
            <span />
          </div>
          <h1 id="gate-title" className={styles.title}>
            Trade access only.
          </h1>
          <ComplianceText id="gate" className={styles.body} />
        </div>
        <div className={styles.panel}>
          {declined ? (
            <p className={styles.declined} role="status">
              This site is for trade buyers aged 21 and over.
            </p>
          ) : null}
          <div className={styles.actions}>
            <form action={confirmAge}>
              <button type="submit" className={styles.enter}>
                Enter
              </button>
            </form>
            <Link href="/?declined=1" className={styles.exit}>
              Exit
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
