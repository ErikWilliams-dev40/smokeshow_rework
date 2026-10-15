import { BreathingMark, SmokeStage } from '@/components/hero/SmokeStage'
import { salesContact, splash } from '@/content/splash'

import styles from './Splash.module.css'

/**
 * Interim splash (issue #6): brand, the brief's two headlines, what we
 * supply, and how to reach sales until the full lead-capture site launches.
 */
export function Splash() {
  return (
    <>
      <header className={styles.header}>
        <p className={styles.wordmark}>
          <span className={styles.cyan}>Smoke</span>{' '}
          <span className={styles.pink}>Show</span> Labs
        </p>
        <a className={styles.headerCta} href="#sales">
          Talk to Sales
        </a>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="splash-title">
          <SmokeStage />
          <div className={styles.heroInner}>
            <div className={styles.copy}>
              <p className={`ov ${styles.eyebrow}`}>Wholesale supply</p>
              <h1 id="splash-title" className={styles.title}>
                {splash.headline}
              </h1>
              <p className={styles.subtitle}>{splash.subheadline}</p>
              <p className={styles.interim}>{splash.interim}</p>
              <a className={styles.primary} href="#sales">
                Talk to Sales
              </a>
            </div>
            <div className={styles.figure}>
              <BreathingMark />
            </div>
          </div>
        </section>

        <section className={styles.supply} aria-labelledby="supply-title">
          <p className={`ov ${styles.eyebrow}`}>What we supply</p>
          <h2 id="supply-title" className={styles.sectionTitle}>
            Bulk, for retailers, distributors and brands.
          </h2>
          <ul className={styles.categories}>
            {splash.categories.map((category, i) => (
              <li key={category} className={styles.category}>
                <span
                  className={`${styles.dot} ${i % 2 === 0 ? styles.dotCyan : styles.dotPink}`}
                  aria-hidden="true"
                />
                {category}
              </li>
            ))}
          </ul>
        </section>

        <section id="sales" className={styles.sales} aria-labelledby="sales-title">
          <p className={`ov ${styles.eyebrow}`}>Talk to Sales</p>
          <h2 id="sales-title" className={styles.sectionTitle}>
            Ask for the current wholesale menu.
          </h2>
          <dl className={styles.contact}>
            <div>
              <dt className="sl">Phone</dt>
              <dd>
                <a href={salesContact.phone.href}>{salesContact.phone.display}</a>
              </dd>
            </div>
            <div>
              <dt className="sl">Email</dt>
              <dd>
                <a href={salesContact.email.href}>{salesContact.email.display}</a>
              </dd>
            </div>
            <div>
              <dt className="sl">Hours</dt>
              <dd>{salesContact.hours}</dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className="sl">© {new Date().getFullYear()} Smoke Show Labs</p>
        <nav aria-label="Legal" className={styles.legal}>
          <a className="sl" href="/privacy">
            Privacy
          </a>
          <a className="sl" href="/terms">
            Terms
          </a>
        </nav>
      </footer>
    </>
  )
}
