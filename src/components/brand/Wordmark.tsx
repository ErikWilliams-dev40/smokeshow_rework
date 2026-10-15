import styles from './Brand.module.css'

export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`${styles.wordmark} ${large ? styles.large : ''}`}
      role="img"
      aria-label="Smoke Show Labs"
    >
      <span className={styles.smoke}>SMOKE</span>{' '}
      <span className={styles.show}>SHOW</span>{' '}
      <span className={styles.labs}>LABS</span>
    </span>
  )
}
