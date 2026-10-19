import styles from './Brand.module.css'

export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    // Supplied brand artwork with intrinsic dimensions to reserve its layout.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`${styles.wordmark} ${large ? styles.large : ''}`}
      src="/brand/ss-logo.png"
      alt="Smoke Show Labs"
      width={3840}
      height={512}
    />
  )
}
