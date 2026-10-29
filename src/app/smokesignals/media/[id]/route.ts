import { serveMedia } from '@/server/blog/media.server'
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return serveMedia((await params).id, request)
}
