import Link from 'next/link'
import type { ArticlePage, ArticleSummary } from '@/domain/article'
import { ArticleImage } from './ArticleBody'
import styles from './Blog.module.css'

export function ArticleDate({ date }: { date: string }) {
  const label = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
  return (
    <time className={styles.date} dateTime={date}>
      {label}
    </time>
  )
}
export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className={styles.card}>
      {article.cover && <ArticleImage media={article.cover} />}
      <ArticleDate date={article.publishedAt} />
      <h2>
        <Link href={`/blog/${article.slug}`} prefetch={false}>
          {article.title}
        </Link>
      </h2>
      <p>{article.excerpt}</p>
    </article>
  )
}
export function ArticleList({ data }: { data: ArticlePage }) {
  return (
    <>
      {data.items.length ? (
        <div className={styles.grid}>
          {data.items.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p>No articles yet on this page.</p>
      )}
      <nav aria-label="Blog pagination" className={styles.pagination}>
        {data.page > 1 && (
          <Link
            href={data.page === 2 ? '/blog' : `/blog?page=${data.page - 1}`}
            prefetch={false}
          >
            Previous page
          </Link>
        )}
        <span>Page {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/blog?page=${data.page + 1}`} prefetch={false}>
            Next page
          </Link>
        )}
      </nav>
    </>
  )
}
