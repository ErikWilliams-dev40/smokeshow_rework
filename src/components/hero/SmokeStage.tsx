import { ThreeSmoke } from './ThreeSmoke'
import styles from './SmokeStage.module.css'

/** The shared low-opacity WebGL haze behind the splash copy. */
export function SmokeStage() {
  return <ThreeSmoke />
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
