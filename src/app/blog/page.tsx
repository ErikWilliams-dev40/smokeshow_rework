import type { Metadata } from 'next'
import { ArticleList } from '@/components/blog/ArticleList'
import { BlogShell, BlogUnavailable } from '@/components/blog/BlogShell'
import { listArticles } from '@/server/blog/client.server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Blog | Smoke Show Labs',
  description: 'Articles for wholesale trade buyers.',
}
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { page: input } = await searchParams
  const candidate =
    typeof input === 'string' && /^[1-9]\d*$/.test(input) ? Number(input) : 1
  const page = Number.isSafeInteger(candidate) ? candidate : 1
  let data
  try {
    data = await listArticles(page)
  } catch {
    return (
      <BlogShell>
        <BlogUnavailable />
      </BlogShell>
    )
  }
  return (
    <BlogShell>
      <h1>Blog</h1>
      <ArticleList data={data} />
    </BlogShell>
  )
}
