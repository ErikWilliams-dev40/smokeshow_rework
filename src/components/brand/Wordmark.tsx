import styles from './Brand.module.css'

export function Wordmark({
  large = false,
  small = false,
}: {
  large?: boolean
  small?: boolean
}) {
  return (
    // Supplied brand artwork, sized for up to 440px at 2x, with intrinsic dimensions to reserve its layout.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`${styles.wordmark} ${large ? styles.large : ''} ${small ? styles.small : ''}`}
      src="/brand/ss-logo-900.webp"
      srcSet="/brand/ss-logo-450.webp 450w, /brand/ss-logo-900.webp 900w"
      sizes={large ? '440px' : small ? '120px' : '260px'}
      fetchPriority="high"
      alt="Smoke Show Labs"
      width={2400}
      height={320}
    />
  )
}
