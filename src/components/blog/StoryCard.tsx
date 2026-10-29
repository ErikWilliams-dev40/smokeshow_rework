import { StoryImage } from './StoryImage'
import Link from 'next/link'
import type { ArticleSummary } from '@/domain/article'
import { articleDateLabel, sectionLabels } from '@/domain/blog'
import styles from './Blog.module.css'

export function ArticleDate({ date, now }: { date: string; now: number }) {
  return (
    <time className={styles.date} dateTime={date}>
      {articleDateLabel(date, now)}
    </time>
  )
}
export function StoryCard({
  story,
  variant = 'stack',
  now,
}: {
  story: ArticleSummary
  variant?:
    | 'lead'
    | 'latest'
    | 'rail'
    | 'feature'
    | 'stack'
    | 'shelf'
    | 'compliance'
    | 'archive'
  now: number
}) {
  const Heading =
    variant === 'lead'
      ? 'h1'
      : variant === 'feature' || variant === 'archive'
        ? 'h2'
        : 'h3'
  return (
    <article className={`${styles.story} ${styles[variant]}`}>
      <Link href={`/smokesignals/${story.slug}`} prefetch={false}>
        <StoryImage media={story.cover} priority={variant === 'lead'} />
        <div className={styles.storyCopy}>
          {story.category && !['latest', 'shelf'].includes(variant) && (
            <span className={styles.eyebrow}>{sectionLabels[story.category]}</span>
          )}
          <Heading>{story.title}</Heading>
          {['lead', 'feature', 'shelf', 'archive'].includes(variant) && (
            <p className={styles.dek}>{story.excerpt}</p>
          )}
          {['lead', 'latest', 'compliance', 'archive'].includes(variant) && (
            <div className={styles.meta}>
              {story.author && <span>{story.author} · </span>}
              <ArticleDate date={story.publishedAt} now={now} />
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
