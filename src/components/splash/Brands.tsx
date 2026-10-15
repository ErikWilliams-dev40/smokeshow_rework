'use client'

import { useEffect, useRef } from 'react'
import { useMotion } from '@/components/motion/MotionSettings'
import styles from './Splash.module.css'

export function Brands() {
  const sectionRef = useRef<HTMLElement>(null)
  const { enabled } = useMotion()

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !enabled || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return

    const names = Array.from(section.querySelectorAll<HTMLElement>(':scope > span'))
    let frame = 0

    const update = () => {
      frame = 0
      const viewportHeight = window.innerHeight
      const progress = Math.min(
        1,
        Math.max(
          0,
          (viewportHeight * 0.95 - section.getBoundingClientRect().top) /
            (viewportHeight * 0.55),
        ),
      )

      names.forEach((name, index) => {
        // Overlapping passes carry the highlight across the whole lineup.
        const localProgress = Math.min(
          1,
          Math.max(0, progress * 2 - index / names.length),
        )
        name.style.setProperty(
          '--brand-shimmer-position',
          `${(1 - localProgress) * 100}%`,
        )
      })
    }

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    section.dataset.shimmer = 'true'
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      delete section.dataset.shimmer
      names.forEach((name) => name.style.removeProperty('--brand-shimmer-position'))
    }
  }, [enabled])

  return (
    <section
      ref={sectionRef}
      id="brands"
      className={styles.brands}
      aria-label="A few names in the lineup"
    >
      <p>A few names in the lineup</p>
      <span>SMOKE SHOW</span>
      <span className={styles.flav}>flav.</span>
      <span className={styles.boutiq}>BOUTIQ</span>
      <span className={styles.blackheart}>BLACKHEART</span>
      <span>DOPE ROPE</span>
    </section>
  )
}
