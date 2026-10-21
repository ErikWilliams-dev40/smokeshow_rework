import { SmokeCanvas } from './SmokeCanvas'
import styles from './SmokeStage.module.css'

/** Keep the CSS haze visible until WebGL has painted, or if it fails. */
export function SmokeStage({ variant = 'hero' }: { variant?: 'hero' | 'intro' }) {
  return (
    <div
      className={styles.smoke}
      data-variant={variant}
      data-renderer="fallback"
      aria-hidden="true"
    >
      <SmokeCanvas />
    </div>
  )
}
