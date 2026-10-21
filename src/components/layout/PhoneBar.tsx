import { salesContact } from '@/content/splash'

import styles from './PhoneBar.module.css'

/**
 * Site-wide sales phone strip. Mounted by the root layout above every route's
 * own content, mirroring HempNotice below it. The whole strip is one tap target.
 */
export function PhoneBar() {
  const { phone } = salesContact
  return (
    <div className={styles.bar}>
      <a
        className={styles.link}
        href={phone.href}
        aria-label={`Call sales at ${phone.display}`}
      >
        <span className={styles.vanity}>{phone.vanity}</span>
        <span className={styles.digits}>{phone.display}</span>
      </a>
    </div>
  )
}
