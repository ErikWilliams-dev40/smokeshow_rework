import { PublicLinks } from '@/components/public/PublicLinks'
import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import type { BlogHomepage } from '@/domain/article'
import { blogHref, sections, sectionLabels, type BlogQuery } from '@/domain/blog'
import { salesContact } from '@/content/splash'
import { BlogChrome } from './BlogChrome'
import styles from './Blog.module.css'

export function BlogShell({
  children,
  article = false,
  latest,
  query,
}: {
  children: ReactNode
  article?: boolean
  latest?: BlogHomepage['latest']
  query?: Partial<BlogQuery>
}) {
  // Only public link text and slugs cross into the interactive drawer.
  const drawerStories = latest
    ? Object.fromEntries(
        Object.entries(latest).map(([section, stories]) => [
          section,
          stories.map(({ slug, title }) => ({ slug, title })),
        ]),
      )
    : undefined
  return (
    <BlogChrome latest={drawerStories} query={query}>
      <main id="main" tabIndex={-1} className={styles.page}>
        {article && (
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/smokesignals">Smoke Signals</Link>
            <Link href={blogHref({ archive: true })}>All stories</Link>
          </nav>
        )}
        {children}
      </main>
      <footer className={styles.footer}>
        <Link href="/smokesignals" className={`${styles.logo} ${styles.footerLogo}`}>
          <Image src="/brand/ss-mark.webp" width={40} height={40} alt="" unoptimized />
          <span>SMOKE SIGNALS</span>
        </Link>
        <div className={styles.footerColumns}>
          <div>
            <h2>Sections</h2>
            {sections.slice(1, 7).map((section) => (
              <Link
                key={section}
                href={blogHref({
                  section: section === 'latest' ? undefined : section,
                  archive: true,
                })}
                prefetch={false}
              >
                {sectionLabels[section]}
              </Link>
            ))}
          </div>
          <div>
            <h2>More</h2>
            <Link href="/smokesignals?view=all&section=compliance">Compliance</Link>
            <Link href="/smokesignals?view=all&section=retail-tips">Retail tips</Link>
            <Link href="/smokesignals?view=all">All stories</Link>
            <Link href="/#how-it-works">How it works</Link>
          </div>
          <div>
            <h2>Wholesale</h2>
            <Link href="/wholesale">Get the Wholesale Menu</Link>
            <a href={salesContact.phone.href}>Talk to Sales</a>
            <Link href="/shipping">Shipping policy</Link>
            <Link href="/wholesale-products">Wholesale products</Link>
          </div>
          <div>
            <h2>Sales</h2>
            <a href={salesContact.phone.href}>{salesContact.phone.display}</a>
            <a href={salesContact.email.href}>{salesContact.email.display}</a>
          </div>
        </div>
        <div className={styles.legal}>
          <span>
            © {new Date().getUTCFullYear()} Smoke Show Labs · For licensed businesses,
            21+
          </span>
          <div>
            <PublicLinks policies />
          </div>
        </div>
      </footer>
    </BlogChrome>
  )
}
export function BlogUnavailable() {
  return (
    <div className={styles.empty}>
      <h1>Articles are unavailable</h1>
      <p>Please try again later.</p>
      <Link href="/smokesignals">Return to Smoke Signals</Link>
    </div>
  )
}
