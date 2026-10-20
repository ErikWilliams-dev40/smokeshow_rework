'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { SmokeStage } from '@/components/hero/SmokeStage'
import { MotionTweaks } from '@/components/motion/MotionSettings'
import { Wordmark } from './Wordmark'
import styles from './Intro.module.css'

const INTRO_KEY = 'ss_intro_seen'
type Phase = 'hidden' | 'showing' | 'exiting'

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* Storage is optional. */
  }
}

export function Intro({ children }: { children: ReactNode }) {
  // Leave the server-rendered page usable before hydration or without JavaScript.
  const [phase, setPhase] = useState<Phase>('hidden')
  const [introduced, setIntroduced] = useState(false)
  const phaseRef = useRef<Phase>('hidden')
  const exitDeadline = useRef(0)
  const exitTimer = useRef<number | undefined>(undefined)
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const focusFrame = useRef<number | undefined>(undefined)
  const finish = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    window.clearTimeout(exitTimer.current)
    exitTimer.current = undefined
    rememberIntro()
    if (phaseRef.current === 'hidden') return
    phaseRef.current = 'hidden'
    const wasOpen = dialog.current?.open
    dialog.current?.close()
    setPhase('hidden')
    if (wasOpen) {
      focusFrame.current = requestAnimationFrame(() =>
        content.current?.focus({ preventScroll: true }),
      )
    }
  }, [])

  const beginExit = useCallback(
    (duration: number) => {
      window.clearTimeout(timer.current)
      timer.current = undefined
      const element = dialog.current
      if (!element?.open || phaseRef.current === 'hidden') return
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish()
        return
      }
      if (phaseRef.current === 'exiting') {
        if (exitDeadline.current - performance.now() <= duration) return
        // Restart from the current opacity only when a skip shortens an active fade.
        const opacity = getComputedStyle(element).opacity
        element.style.transition = 'none'
        element.style.opacity = opacity
        void element.offsetWidth
        element.style.removeProperty('transition')
      }
      element.style.setProperty('--intro-exit-duration', `${duration}ms`)
      element.style.opacity = '0'
      phaseRef.current = 'exiting'
      setPhase('exiting')
      exitDeadline.current = performance.now() + duration
      window.clearTimeout(exitTimer.current)
      // Transition events may be lost when a tab is hidden or styles are interrupted.
      exitTimer.current = window.setTimeout(finish, duration + 100)
    },
    [finish],
  )

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
      dialog.current?.style.removeProperty('opacity')
      dialog.current?.showModal()
      phaseRef.current = 'showing'
      setPhase('showing')
      setIntroduced(true)
      skip.current?.focus()
      timer.current = window.setTimeout(() => beginExit(800), 2200)
    }, 0)
    const onMotionChange = () => {
      if (reducedMotion.matches) finish()
    }
    reducedMotion.addEventListener('change', onMotionChange)
    return () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(exitTimer.current)
      if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current)
      reducedMotion.removeEventListener('change', onMotionChange)
    }
  }, [beginExit, finish])

  return (
    <>
      <dialog
        ref={dialog}
        className={styles.intro}
        data-phase={phase}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === 'opacity' &&
            phaseRef.current === 'exiting'
          )
            finish()
        }}
        aria-label="Welcome to Smoke Show Labs"
        onCancel={(event) => {
          event.preventDefault()
          beginExit(200)
        }}
      >
        {phase !== 'hidden' ? <SmokeStage variant="intro" /> : null}
        <div className={styles.top}>
          <span>Los Angeles, California</span>
          <div className={styles.actions}>
            <MotionTweaks inline />
            <button ref={skip} onClick={() => beginExit(200)}>
              Skip intro <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <div className={styles.center}>
          <h1 className={styles.title}>
            <Wordmark />
          </h1>
          <div className={styles.bottom}>
            <span className={styles.rule} />
            <p>
              Make your shelves a <strong>Smoke Show.</strong>
            </p>
          </div>
        </div>
      </dialog>
      <div
        ref={content}
        inert={phase !== 'hidden'}
        data-intro-presented={introduced}
        tabIndex={-1}
        className={styles.content}
      >
        {children}
      </div>
    </>
  )
}
