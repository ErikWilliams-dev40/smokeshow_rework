'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ThreeSmoke } from '@/components/hero/ThreeSmoke'
import { MotionTweaks } from '@/components/motion/MotionSettings'
import styles from './Intro.module.css'

const INTRO_KEY = 'ss_intro_seen'

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* Storage is optional. */
  }
}

export function Intro({ children }: { children: ReactNode }) {
  // Leave the server-rendered page usable before hydration or without JavaScript.
  const [visible, setVisible] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const focusFrame = useRef<number | undefined>(undefined)
  const finish = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    rememberIntro()
    const wasOpen = dialog.current?.open
    dialog.current?.close()
    setVisible(false)
    if (wasOpen) {
      focusFrame.current = requestAnimationFrame(() =>
        content.current?.focus({ preventScroll: true }),
      )
    }
  }, [])

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === '1'
    } catch {
      /* Continue without storage. */
    }
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    if (seen) return
    if (reducedMotion.matches) {
      rememberIntro()
      return
    }

    timer.current = window.setTimeout(() => {
      dialog.current?.showModal()
      setVisible(true)
      skip.current?.focus()
      timer.current = window.setTimeout(finish, 3000)
    }, 0)
    const onMotionChange = () => {
      if (reducedMotion.matches) finish()
    }
    reducedMotion.addEventListener('change', onMotionChange)
    return () => {
      window.clearTimeout(timer.current)
      if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current)
      reducedMotion.removeEventListener('change', onMotionChange)
    }
  }, [finish])

  return (
    <>
      <dialog
        ref={dialog}
        className={styles.intro}
        aria-label="Welcome to Smoke Show Labs"
        onCancel={(event) => {
          event.preventDefault()
          finish()
        }}
      >
        {visible ? <ThreeSmoke /> : null}
        <div className={styles.top}>
          <span>Los Angeles, California</span>
          <div className={styles.actions}>
            <MotionTweaks inline />
            <button ref={skip} onClick={finish}>
              Skip intro <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <div className={styles.center}>
          <h1 className={styles.title}>
            <span>SMOKE</span> <span>SHOW</span>
          </h1>
          <div className={styles.bottom}>
            <span className={styles.labs}>LABS</span>
            <span className={styles.rule} />
            <p>
              Make your shelves a <strong>Smoke Show.</strong>
            </p>
          </div>
        </div>
      </dialog>
      <div ref={content} inert={visible} tabIndex={-1} className={styles.content}>
        {children}
      </div>
    </>
  )
}
