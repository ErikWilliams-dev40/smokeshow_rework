import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleBody, ArticleImage } from '@/components/blog/ArticleBody'
import { ArticleDate } from '@/components/blog/ArticleList'
import { BlogShell, BlogUnavailable } from '@/components/blog/BlogShell'
import styles from '@/components/blog/Blog.module.css'
import { getHomepage } from '@/server/blog/client.server'
import { sectionLabels } from '@/domain/blog'
import { articleResult, blogRenderTime } from '@/server/blog/request.server'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await articleResult((await params).slug)
  return result.status === 200
    ? {
        title: `${result.article.title} | Smoke Signals`,
        description: result.article.excerpt,
      }
    : {
        title: 'Smoke Signals | Smoke Show Labs',
        description: '',
        robots: { index: false },
      }
}
export default async function ArticlePage({ params }: Props) {
  const result = await articleResult((await params).slug)
  if (result.status === 404) notFound()
  if (result.status !== 200)
    return (
      <BlogShell article>
        <BlogUnavailable />
      </BlogShell>
    )
  const { article } = result
  const home = await getHomepage().catch(() => undefined)
  return (
    <BlogShell article latest={home?.latest} query={{ section: article.category }}>
      <article className={styles.article}>
        {article.category && (
          <span className={styles.eyebrow}>{sectionLabels[article.category]}</span>
        )}
        <h1>{article.title}</h1>
        <ArticleDate date={article.publishedAt} now={blogRenderTime()} />
        {article.author && <p>By {article.author}</p>}
        <p className={styles.excerpt}>{article.excerpt}</p>
        {article.cover && <ArticleImage media={article.cover} priority />}
        <ArticleBody blocks={article.body} />
      </article>
    </BlogShell>
  )
}
