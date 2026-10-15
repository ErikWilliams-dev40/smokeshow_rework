'use client'

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import styles from './MotionSettings.module.css'

const QUERY = '(prefers-reduced-motion: reduce)'
const MotionContext = createContext({
  enabled: true,
  reduced: false,
  setEnabled: (_enabled: boolean) => {},
})
const subscribe = (onChange: () => void) => {
  const media = matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true)
  const reduced = useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  )
  return (
    <MotionContext.Provider
      value={{ enabled: enabled && !reduced, reduced, setEnabled }}
    >
      {children}
    </MotionContext.Provider>
  )
}

export const useMotion = () => useContext(MotionContext)

export function MotionTweaks({ inline = false }: { inline?: boolean }) {
  const { enabled, reduced, setEnabled } = useMotion()
  return (
    <details className={`${styles.tweaks} ${inline ? styles.inline : ''}`}>
      <summary>Tweaks</summary>
      <div className={styles.panel}>
        <label>
          Motion
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            disabled={reduced}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </label>
        <p>
          {reduced
            ? 'Paused for your reduced-motion preference.'
            : 'Slow smoke drift. Switch off to freeze the haze.'}
        </p>
      </div>
    </details>
  )
}
