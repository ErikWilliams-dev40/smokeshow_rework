import Link from 'next/link'
import type { ArticlePage } from '@/domain/article'
import { blogHref, type BlogQuery } from '@/domain/blog'
import { StoryCard } from './StoryCard'
import styles from './Blog.module.css'
export { ArticleDate } from './StoryCard'

export function ArticleList({
  data,
  query,
  now,
}: {
  data: ArticlePage
  now: number
  query?: Partial<BlogQuery>
}) {
  return (
    <>
      {data.items.length ? (
        <div className={styles.grid}>
          {data.items.map((article) => (
            <StoryCard key={article.slug} story={article} variant="archive" now={now} />
          ))}
        </div>
      ) : (
        <p>No articles yet on this page.</p>
      )}
      <nav aria-label="Blog pagination" className={styles.pagination}>
        {data.page > 1 && (
          <Link
            href={blogHref({ ...query, archive: true, page: data.page - 1 })}
            prefetch={false}
          >
            Previous page
          </Link>
        )}
        <span>Page {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link
            href={blogHref({ ...query, archive: true, page: data.page + 1 })}
            prefetch={false}
          >
            Next page
          </Link>
        )}
      </nav>
    </>
  )
}
