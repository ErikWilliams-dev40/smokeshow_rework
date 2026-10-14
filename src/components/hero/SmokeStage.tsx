import styles from './SmokeStage.module.css'

/**
 * The handoff's hero smoke stage (README § Hero smoke stage), minus the grain
 * tile and the cursor trail: four blurred copies of the mark drifting behind
 * the content, a scrim that keeps copy legible, and the crisp mark breathing
 * over a pink-to-cyan halo. Decorative only, so hidden from assistive tech.
 */
export function SmokeStage() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={`${styles.plume} ${styles.p1}`} />
      <div className={`${styles.plume} ${styles.p2}`} />
      <div className={`${styles.plume} ${styles.p3}`} />
      <div className={`${styles.plume} ${styles.p4}`} />
      <div className={styles.scrim} />
    </div>
  )
}

/** The crisp mark with its halo, for the right-hand figure. */
export function BreathingMark() {
  return (
    <div className={styles.figure} aria-hidden="true">
      <div className={styles.halo} />
      {/* A decorative 512px WebP with fixed dimensions. next/image would add an
          optimizer route the Cloudflare host must provide, for no gain here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.mark}
        src="/brand/ss-mark.webp"
        alt=""
        width={512}
        height={512}
      />
    </div>
  )
}
