import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './Blog.module.css'
export function BlogShell({
  children,
  article = false,
}: {
  children: ReactNode
  article?: boolean
}) {
  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href="/">Smoke Show Labs</Link>
        {article && <Link href="/blog">Blog</Link>}
      </nav>
      {children}
    </main>
  )
}
export function BlogUnavailable() {
  return (
    <>
      <h1>Articles are unavailable</h1>
      <p>Please try again later.</p>
    </>
  )
}
