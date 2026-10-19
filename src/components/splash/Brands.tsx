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
    let visible = false
    let distance = 0
    let beam = 0
    let current = 0
    let target = 0
    let lastTime = 0

    const paint = () => {
      section.style.setProperty('--brand-shimmer-position', `${current}px`)
    }

    const animate = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16
      lastTime = time
      // A short, frame-rate-independent catch-up softens wheel and touch steps.
      current += (target - current) * (1 - Math.exp(-elapsed / 90))
      if (Math.abs(target - current) < 0.1) current = target
      paint()
      frame = current === target ? 0 : requestAnimationFrame(animate)
      if (!frame) lastTime = 0
    }

    const update = () => {
      const viewportHeight = window.innerHeight
      const bounds = section.getBoundingClientRect()
      const progress = Math.min(
        1,
        Math.max(
          0,
          (viewportHeight * 0.9 - bounds.top) /
            (viewportHeight * 0.65 + bounds.height * 0.5),
        ),
      )
      target = -beam + progress * (distance + beam)
      if (!visible) {
        current = target
        paint()
      } else if (!frame) {
        frame = requestAnimationFrame(animate)
      }
    }

    const measure = () => {
      // Lay out a virtual single line so the pass follows reading order even
      // when the actual names wrap. Width-based spacing avoids overlapping flashes.
      const measurements = names.map((name) => ({
        name,
        width: name.getBoundingClientRect().width,
      }))
      distance = 0
      measurements.forEach(({ name, width }, index) => {
        name.style.setProperty('--brand-shimmer-offset', `${-distance}px`)
        distance += width + (index < names.length - 1 ? 28 : 0)
      })
      beam = Math.min(180, Math.max(80, distance * 0.2))
      section.style.setProperty('--brand-shimmer-width', `${beam}px`)
      update()
    }

    measure()
    section.dataset.shimmer = 'true'
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (!visible) {
        cancelAnimationFrame(frame)
        frame = 0
        lastTime = 0
      }
      update()
    })
    visibility.observe(section)
    const size = new ResizeObserver(measure)
    size.observe(section)
    names.forEach((name) => size.observe(name))
    const onScroll = () => {
      if (visible) update()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      visibility.disconnect()
      size.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
      delete section.dataset.shimmer
      section.style.removeProperty('--brand-shimmer-position')
      section.style.removeProperty('--brand-shimmer-width')
      names.forEach((name) => name.style.removeProperty('--brand-shimmer-offset'))
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
