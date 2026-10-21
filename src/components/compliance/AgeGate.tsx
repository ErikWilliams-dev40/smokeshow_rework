import Link from 'next/link'

import { Wordmark } from '@/components/brand/Wordmark'
import type { GateDestination } from '@/domain/gate'
import { ComplianceText } from './ComplianceText'
import styles from './AgeGate.module.css'

type Props = {
  declined: boolean
  destination?: GateDestination
  confirmAge: (formData: FormData) => Promise<never>
}

export function AgeGate({ declined, destination = '/', confirmAge }: Props) {
  const declineHref = `${destination}?declined=1`
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="gate-title">
        <Wordmark large />
        <p className={styles.eyebrow}>Wholesale, with some personality.</p>
        <h1 id="gate-title" className={styles.title}>
          Are you 21
          <br />
          or older?
        </h1>
        <div className={styles.actions}>
          <form action={confirmAge}>
            <input type="hidden" name="destination" value={destination} />
            <button type="submit" className={styles.enter}>
              Yes, I’m 21+
            </button>
          </form>
          <Link href={declineHref} className={styles.exit}>
            No
          </Link>
        </div>
        {declined ? (
          <p className={styles.declined} role="status">
            This site is for trade buyers aged 21 and over.
          </p>
        ) : null}
        <ComplianceText id="gate" className={styles.body} />
        <p className={styles.footnote}>For licensed retailers and distributors.</p>
      </section>
    </main>
  )
}
