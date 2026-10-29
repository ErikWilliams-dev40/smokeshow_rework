import { blogRenderTime } from '@/server/blog/request.server'
import { pageMetadata } from '@/server/seo/metadata'
import { ArticleList } from '@/components/blog/ArticleList'
import { BlogShell, BlogUnavailable } from '@/components/blog/BlogShell'
import { BlogHome } from '@/components/blog/BlogHome'
import { BlogSearch } from '@/components/blog/BlogChrome'
import { getHomepage, listArticles } from '@/server/blog/client.server'
import {
  blogCanonical,
  normalizeBlogQuery,
  sectionLabels,
  type BlogSearchParams,
} from '@/domain/blog'
import styles from '@/components/blog/Blog.module.css'

export const dynamic = 'force-dynamic'
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>
}) {
  const query = normalizeBlogQuery(await searchParams)
  return pageMetadata(
    blogCanonical(query),
    'Smoke Signals',
    'Wholesale, product, compliance and retail stories from Smoke Show Labs.',
    !query.q,
  )
}
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>
}) {
  const query = normalizeBlogQuery(await searchParams)
  const now = blogRenderTime()
  if (query.archive) {
    const [home, result] = await Promise.allSettled([
      getHomepage(),
      listArticles(query.page, query),
    ])
    return (
      <BlogShell
        latest={home.status === 'fulfilled' ? home.value.latest : undefined}
        query={query}
      >
        {result.status === 'fulfilled' ? (
          <div className={styles.archivePage}>
            <span className={styles.eyebrow}>Smoke Signals</span>
            <h1>
              {query.q
                ? `Search results for “${query.q}”`
                : query.section
                  ? `${sectionLabels[query.section]} stories`
                  : 'All stories'}
            </h1>
            <BlogSearch key={`${query.section ?? ''}:${query.q}`} query={query} />
            <ArticleList data={result.value} query={query} now={now} />
          </div>
        ) : (
          <BlogUnavailable />
        )}
      </BlogShell>
    )
  }
  let home
  try {
    home = await getHomepage()
  } catch {
    return (
      <BlogShell query={query}>
        <BlogUnavailable />
      </BlogShell>
    )
  }
  return (
    <BlogShell latest={home.latest} query={query}>
      <BlogHome data={home} section={query.section} now={now} />
    </BlogShell>
  )
}
