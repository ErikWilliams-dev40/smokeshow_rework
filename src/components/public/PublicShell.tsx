import type { ReactNode } from 'react'
import Link from 'next/link'
import { PublicLinks } from './PublicLinks'
import styles from './Public.module.css'
export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        Smoke Show Labs
      </Link>
      <nav aria-label="Public navigation">
        <PublicLinks />
      </nav>
    </header>
  )
}
export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <p>Smoke Show Labs · For licensed businesses, 21+</p>
      <nav aria-label="Public footer">
        <PublicLinks policies />
      </nav>
    </footer>
  )
}
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  )
}
