'use client'

import { useEffect, useRef } from 'react'
import { useMotion } from '@/components/motion/MotionSettings'
import type { createSmokeRenderer } from './smoke-renderer'
import styles from './ThreeSmoke.module.css'

export function ThreeSmoke() {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const controls = useRef<ReturnType<typeof createSmokeRenderer> | null>(null)
  const motion = useRef(false)
  const { enabled } = useMotion()
  useEffect(() => {
    motion.current = enabled
    controls.current?.setMotion(enabled)
  }, [enabled])
  useEffect(() => {
    let cancelled = false
    const element = host.current
    const target = canvas.current
    if (!element || !target) return
    // Dynamic import keeps Three.js out of the age gate's initial bundle.
    void import('./smoke-renderer')
      .then(({ createSmokeRenderer }) => {
        if (cancelled) return
        controls.current = createSmokeRenderer(target, element)
        controls.current.setMotion(motion.current)
      })
      .catch(() => {
        if (!cancelled) element.dataset.renderer = 'fallback'
      })
    return () => {
      cancelled = true
      controls.current?.dispose()
      controls.current = null
    }
  }, [])
  return (
    <div
      ref={host}
      className={styles.smoke}
      data-renderer="fallback"
      aria-hidden="true"
    >
      <canvas ref={canvas} />
    </div>
  )
}
