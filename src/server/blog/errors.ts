import 'server-only'
export class BlogNotFoundError extends Error {
  override name = 'BlogNotFoundError'
  constructor() {
    super('Article not found')
  }
}
export class BlogUnavailableError extends Error {
  override name = 'BlogUnavailableError'
  constructor(message = 'Articles are unavailable') {
    super(message)
  }
}
