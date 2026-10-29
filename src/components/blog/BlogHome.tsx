import Link from 'next/link'
import type { ReactNode } from 'react'
import type { BlogHomepage, ArticleCategory } from '@/domain/article'
import { blogHref, sectionLabels } from '@/domain/blog'
import { StoryCard } from './StoryCard'
import styles from './Blog.module.css'

function SectionHeading({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{children}</h2>
      <span />
      {note && <small>{note}</small>}
    </div>
  )
}
function SignupBand() {
  return (
    <section
      id="signup"
      className={styles.signupBand}
      aria-labelledby="blog-signup-title"
    >
      <div className={styles.bandSmoke} aria-hidden="true">
        <i />
        <i />
      </div>
      <div>
        <span className={styles.eyebrow}>The wholesale menu</span>
        <h2 id="blog-signup-title">Get the menu and your own salesperson.</h2>
      </div>
      <div>
        <Link className={styles.button} href="/wholesale">
          Get the Wholesale Menu
        </Link>
        <p>
          For licensed businesses, 21+. Start with your email, name and phone number on
          our wholesale signup page.
        </p>
      </div>
    </section>
  )
}
export function BlogHome({
  data,
  section,
  now,
}: {
  data: BlogHomepage
  now: number
  section?: ArticleCategory
}) {
  const latest = data.latest[section ?? 'latest']
  return (
    <>
      <section className={styles.wholesaleBanner} aria-label="Wholesale supply">
        <strong>STOCK UP. STAND OUT.</strong>
        <p>Bulk flower, vapes, edibles &amp; more for licensed businesses.</p>
        <Link href="/wholesale" className={styles.outlineButton}>
          Get the Wholesale Menu
        </Link>
      </section>
      <div className={styles.magazine}>
        <section className={styles.hero} aria-label="Top stories">
          <div className={styles.latestColumn}>
            <SectionHeading>{sectionLabels[section ?? 'latest']}</SectionHeading>
            {latest.map((story) => (
              <StoryCard key={story.slug} story={story} variant="latest" now={now} />
            ))}
            {!latest.length && <p>No stories in this section yet.</p>}
            <Link
              className={styles.allStories}
              href={blogHref({ section, archive: true })}
            >
              All {section ? sectionLabels[section] : ''} stories
            </Link>
          </div>
          <div className={styles.leadColumn}>
            {data.lead ? (
              <StoryCard story={data.lead} variant="lead" now={now} />
            ) : (
              <div className={styles.empty}>
                <h1>Smoke Signals</h1>
                <p>No articles yet. Check back soon.</p>
              </div>
            )}
          </div>
          <div className={styles.railColumn}>
            {data.rail.map((story) => (
              <StoryCard key={story.slug} story={story} variant="rail" now={now} />
            ))}
          </div>
        </section>
        <SignupBand />
        {(data.feature || data.featured.length > 0) && (
          <section>
            <SectionHeading>Featured</SectionHeading>
            <div className={styles.featureGrid}>
              {data.feature && (
                <StoryCard story={data.feature} variant="feature" now={now} />
              )}
              <div>
                {data.featured.map((story) => (
                  <StoryCard key={story.slug} story={story} now={now} />
                ))}
              </div>
            </div>
          </section>
        )}
        {data.shelf.length > 0 && (
          <section>
            <SectionHeading>On the shelf</SectionHeading>
            <div className={styles.shelfGrid}>
              {data.shelf.map((story) => (
                <StoryCard key={story.slug} story={story} variant="shelf" now={now} />
              ))}
            </div>
          </section>
        )}
        {data.complianceRetail.length > 0 && (
          <section>
            <SectionHeading note="Not legal advice">
              Compliance &amp; Retail
            </SectionHeading>
            <div className={styles.complianceGrid}>
              {data.complianceRetail.map((story) => (
                <StoryCard
                  key={story.slug}
                  story={story}
                  variant="compliance"
                  now={now}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
