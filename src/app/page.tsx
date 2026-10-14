import styles from './page.module.css'

/**
 * Placeholder for screen 2a (Home).
 *
 * Still a placeholder — the real screen needs the hero smoke stage, the
 * countdown band and the layout chrome, none of which exist yet. What it now
 * does is exercise the token layer end to end, so a broken token or a font that
 * failed to load is visible on the first route rather than at screen-build time.
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <p className={`ov ${styles.eyebrow}`}>White-label programme</p>
      <h1 className={styles.title}>Smoke Show Labs</h1>
      <p className={styles.lede}>
        Wholesale storefront — under construction. The token layer is in place; screens
        follow.
      </p>
      <hr className={styles.rule} />
      <dl className={styles.specs}>
        <div>
          <dt className="sl">Screens specified</dt>
          <dd>13</dd>
        </div>
        <div>
          <dt className="sl">Screens built</dt>
          <dd>0</dd>
        </div>
      </dl>
    </main>
  )
}
