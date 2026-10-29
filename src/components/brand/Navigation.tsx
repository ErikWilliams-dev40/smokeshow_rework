'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Wordmark } from './Wordmark'
import styles from './Navigation.module.css'

export function Navigation() {
  const [open, setOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const desktop = matchMedia('(width > 900px)')
    const onResize = () => {
      if (desktop.matches) setOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    const onOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    desktop.addEventListener('change', onResize)
    document.addEventListener('keydown', onEscape)
    document.addEventListener('pointerdown', onOutsideClick)
    return () => {
      desktop.removeEventListener('change', onResize)
      document.removeEventListener('keydown', onEscape)
      document.removeEventListener('pointerdown', onOutsideClick)
    }
  }, [open])
  return (
    <>
      <div className={styles.announcement}>
        <span>For retailers. For distributors. For your next move.</span>
        <a href="#contact">
          Talk wholesale <span aria-hidden="true">↗</span>
        </a>
      </div>
      <header ref={header} className={styles.header}>
        <Link href="/" aria-label="Smoke Show Labs home" className={styles.logo}>
          <Wordmark />
        </Link>
        <nav className={styles.desktop} aria-label="Main navigation">
          <Link href="/blog">Smoke Signals</Link>
          <Link href="/wholesale-products">Wholesale products</Link>
          <a href="#products">Products</a>
          <a href="#brands">Brands</a>
          <a href="#helix">House of Helix</a>
          <a href="#how-it-works">How it works</a>
          <a href="#contact">Contact</a>
        </nav>
        <Link className={styles.cta} href="/wholesale">
          Get the Wholesale Menu
        </Link>
        <button
          ref={toggle}
          id="menu-toggle"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Menu'}
          <span aria-hidden="true">{open ? '−' : '☰'}</span>
        </button>
        <nav
          id="mobile-navigation"
          className={styles.mobile}
          aria-label="Mobile navigation"
          hidden={!open}
        >
          {[
            ['Smoke Signals', '/blog'],
            ['Wholesale products', '/wholesale-products'],
            ['Products', '#products'],
            ['Brands', '#brands'],
            ['House of Helix', '#helix'],
            ['How it works', '#how-it-works'],
            ['Contact', '#contact'],
            ['Get the Wholesale Menu', '/wholesale'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href!}
              onClick={() => {
                setOpen(false)
                if (href?.startsWith('#')) {
                  requestAnimationFrame(() => {
                    const destination = document.getElementById(href.slice(1))
                    destination?.setAttribute('tabindex', '-1')
                    destination?.focus({ preventScroll: true })
                  })
                }
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  )
}
