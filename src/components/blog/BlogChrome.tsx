'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { ArticleSummary } from '@/domain/article'
import { blogHref, sectionLabels, sections, type BlogQuery } from '@/domain/blog'
import { salesContact } from '@/content/splash'
import { useMotion } from '@/components/motion/MotionSettings'
import styles from './Blog.module.css'

const emptySubscribe = () => () => {}
const subscribeScroll = (listener: () => void) => {
  window.addEventListener('scroll', listener, { passive: true })
  return () => window.removeEventListener('scroll', listener)
}
const subscribeDismissal = (listener: () => void) => {
  window.addEventListener('ss-blog-bar', listener)
  return () => window.removeEventListener('ss-blog-bar', listener)
}
const dismissalKey = 'ss_blog_signup_dismissed'
function isDismissed() {
  try {
    return sessionStorage.getItem(dismissalKey) === '1'
  } catch {
    return false
  }
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link
      className={`${styles.logo} ${small ? styles.smallLogo : ''}`}
      href="/blog"
      aria-label="Smoke Signals home"
    >
      <Image src="/brand/ss-mark.webp" width={40} height={40} alt="" unoptimized />
      <span>SMOKE SIGNALS</span>
    </Link>
  )
}

export function BlogSearch({
  query,
  inputRef,
}: {
  query?: Partial<BlogQuery>
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <form action="/blog" method="get" role="search" className={styles.searchForm}>
      <input type="hidden" name="view" value="all" />
      {query?.section && <input type="hidden" name="section" value={query.section} />}
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label="Search Smoke Signals"
        placeholder="Search Smoke Signals"
        defaultValue={query?.q ?? ''}
        maxLength={200}
      />
      <button type="submit" className={styles.outlineButton}>
        Search
      </button>
    </form>
  )
}

export function BlogChrome({
  children,
  latest,
  query,
}: {
  children: ReactNode
  latest?: Partial<
    Record<(typeof sections)[number], Pick<ArticleSummary, 'slug' | 'title'>[]>
  >
  query?: Partial<BlogQuery>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [dismissedHere, setDismissedHere] = useState(false)
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 40,
    () => false,
  )
  const dismissed = useSyncExternalStore(subscribeDismissal, isDismissed, () => false)
  const { enabled } = useMotion()
  const close = () => {
    dialog.current?.close()
    setOpen(false)
    trigger.current?.focus()
  }
  const show = (button: HTMLButtonElement, focusSearch: boolean) => {
    trigger.current = button
    dialog.current?.showModal()
    setOpen(true)
    if (focusSearch) search.current?.focus()
  }
  const dismiss = () => {
    setDismissedHere(true)
    try {
      sessionStorage.setItem(dismissalKey, '1')
    } catch {
      /* Per-page dismissal still works. */
    }
    window.dispatchEvent(new Event('ss-blog-bar'))
  }
  return (
    <div
      className={styles.shell}
      data-motion={enabled ? 'on' : 'off'}
      data-sticky-bar={hydrated && !dismissed && !dismissedHere && !open}
    >
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <div className={styles.topSmoke} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className={styles.utility}>
        <div>
          <Link href="/">SMOKE SHOW LABS</Link>
          <span>Licensed businesses, 21+</span>
          <Link href="/#how-it-works">How it works</Link>
          <a href={salesContact.phone.href}>Talk to Sales</a>
        </div>
        <Link href="/shipping">Shipping policy</Link>
      </div>
      <header className={styles.header} data-scrolled={scrolled}>
        <div className={styles.headerRow}>
          <button
            className={styles.sectionsButton}
            aria-label="Open sections"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="blog-drawer"
            disabled={!hydrated}
            onClick={(event) => show(event.currentTarget, false)}
          >
            <span className={styles.hamburger} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.desktopLabel}>Sections</span>
          </button>
          <Logo />
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              aria-label="Open search"
              aria-haspopup="dialog"
              aria-controls="blog-drawer"
              disabled={!hydrated}
              onClick={(event) => show(event.currentTarget, true)}
            >
              <span className={styles.searchIcon} aria-hidden="true" />
            </button>
            <Link className={styles.button} href="/wholesale">
              Get the Wholesale Menu
            </Link>
          </div>
        </div>
        <nav className={styles.sectionNav} aria-label="Blog sections">
          {sections.map((section) => (
            <Link
              key={section}
              href={blogHref({ section: section === 'latest' ? undefined : section })}
              prefetch={false}
              aria-current={
                (query?.section ?? 'latest') === section ? 'page' : undefined
              }
            >
              {sectionLabels[section]}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <dialog
        ref={dialog}
        id="blog-drawer"
        className={styles.drawer}
        aria-label="Smoke Signals sections and search"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX > rect.right ||
            event.clientX < rect.left ||
            event.clientY > rect.bottom ||
            event.clientY < rect.top
          )
            close()
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const focusable = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              'a[href], button, input:not([type="hidden"]), summary',
            ) ?? [],
          ).filter((el) => el.getClientRects().length > 0)
          const first = focusable[0],
            last = focusable.at(-1)
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
      >
        <div className={styles.drawerHeader}>
          <span onClick={close}>
            <Logo small />
          </span>
          <button
            className={styles.iconButton}
            aria-label="Close sections"
            onClick={close}
          >
            ×
          </button>
        </div>
        <div className={styles.drawerSearch}>
          <BlogSearch query={query} inputRef={search} />
        </div>
        <nav className={styles.drawerSections} aria-label="Drawer sections">
          {sections.slice(1).map((section) => (
            <details key={section} name="blog-sections">
              <summary>
                {sectionLabels[section]}
                <span aria-hidden="true" />
              </summary>
              {(latest?.[section] ?? []).slice(0, 2).map((story) => (
                <Link
                  key={story.slug}
                  href={`/blog/${story.slug}`}
                  prefetch={false}
                  onClick={close}
                >
                  {story.title}
                </Link>
              ))}
              {latest && !latest[section]?.length && (
                <p>No stories in this section yet.</p>
              )}
              <Link
                href={blogHref({
                  section: section === 'latest' ? undefined : section,
                  archive: true,
                })}
                prefetch={false}
                onClick={close}
              >
                All {sectionLabels[section]} stories
              </Link>
            </details>
          ))}
        </nav>
        <div className={styles.drawerBottom}>
          <Link className={styles.button} href="/wholesale" onClick={close}>
            Get the Wholesale Menu
          </Link>
        </div>
      </dialog>
      {hydrated && !dismissed && !dismissedHere && !open && (
        <aside className={styles.stickySignup} aria-label="Wholesale menu signup">
          <span>Get the current wholesale menu.</span>
          <Link className={styles.button} href="/wholesale">
            Sign up
          </Link>
          <button
            className={styles.iconButton}
            aria-label="Dismiss signup bar"
            onClick={dismiss}
          >
            ×
          </button>
        </aside>
      )}
    </div>
  )
}
