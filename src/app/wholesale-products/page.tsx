import Link from 'next/link'
import { categories, signupCopy, steps } from '@/content/wholesale'
import { splash } from '@/content/splash'
import { InterestLink } from '@/components/wholesale/InterestLink'
import { PublicShell } from '@/components/public/PublicShell'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { publicBreadcrumbs } from '@/domain/breadcrumbs'
import { pageMetadata } from '@/server/seo/metadata'
import styles from '@/components/public/Public.module.css'
export function generateMetadata() {
  return pageMetadata('/wholesale-products', 'Wholesale products', splash.subheadline)
}
export default function WholesaleProductsPage() {
  const crumbs = publicBreadcrumbs('/wholesale-products', 'Wholesale products')
  return (
    <PublicShell>
      <main className={styles.page}>
        <Breadcrumbs items={crumbs} />
        <h1>{splash.subheadline}</h1>
        <p>{signupCopy.introduction}</p>
        <Link className={styles.cta} href="/wholesale">
          Get the Wholesale Menu
        </Link>
        <div className={styles.grid}>
          {categories.map((category) => (
            <section className={styles.card} key={category.title}>
              <h2>{category.title}</h2>
              <p>{category.detail}</p>
              <InterestLink interest={category.interest} className={styles.cta}>
                Ask about {category.title.toLowerCase()}
              </InterestLink>
            </section>
          ))}
        </div>
        <section className={styles.card}>
          <h2>HOUSE OF HELIX</h2>
          <p>{signupCopy.helix}</p>
          <InterestLink interest="HOUSE OF HELIX Peptide Strips" className={styles.cta}>
            Get the Wholesale Menu
          </InterestLink>
        </section>
        <h2>How it works</h2>
        <div className={styles.grid}>
          {steps.map((step) => (
            <section key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </section>
          ))}
        </div>
        <Link className={styles.cta} href="/wholesale">
          Get the Wholesale Menu
        </Link>
      </main>
    </PublicShell>
  )
}
