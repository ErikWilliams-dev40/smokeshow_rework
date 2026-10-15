import type { PolicyPageCopy } from '@/content/policies'

import styles from './PolicyPage.module.css'

/**
 * Shared layout for /privacy and /terms (issue #14). Deliberately outside the
 * age gate: a visitor deciding whether to enter is entitled to read these.
 */
export function PolicyPage({ copy }: { copy: PolicyPageCopy }) {
  return (
    <main className={styles.page}>
      <p className={styles.back}>
        <a className="sl" href="/">
          Smoke Show Labs
        </a>
      </p>
      <h1 className={styles.title}>{copy.title}</h1>
      {copy.placeholder ? (
        <p className={styles.notice} role="note">
          {copy.notice}
        </p>
      ) : null}
      {copy.sections.map((heading) => (
        <section key={heading} className={styles.section}>
          <h2 className={styles.heading}>{heading}</h2>
          {copy.placeholder ? <p className={styles.pending}>Text to follow.</p> : null}
        </section>
      ))}
    </main>
  )
}
