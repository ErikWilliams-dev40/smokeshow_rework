import 'server-only'
import { article, articleCategory, type Article } from '@/domain/article'

/** Development examples only. These review records are not editorial sign-off. */
export const articles: Article[] = Array.from({ length: 24 }, (_, index) =>
  article.parse({
    category: articleCategory.options[index % articleCategory.options.length],
    slug: index === 0 ? 'planning-a-wholesale-inquiry' : `sample-article-${index + 1}`,
    title:
      index === 0
        ? 'Planning a wholesale inquiry'
        : `Wholesale planning example ${index + 1}`,
    excerpt: 'A development example for trade buyers preparing to speak with the team.',
    publishedAt: new Date(Date.UTC(2026, 9, 22 - index, 12)).toISOString(),
    ...(index === 0
      ? {
          author: 'Smoke Show Labs',
        }
      : {}),
    review: {
      status: 'approved',
      approvedBy: 'Local fixture only',
      approvedAt: '2026-09-01T12:00:00Z',
    },
    body: [
      { type: 'heading', level: 2, text: 'Prepare for the conversation' },
      {
        type: 'paragraph',
        text: 'This sample article is for local development. Gather the questions you want to discuss with the wholesale team.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Identify the categories you want to discuss.',
          'Write down your packaging questions.',
        ],
      },
      { type: 'heading', level: 3, text: 'Useful next steps' },
      {
        type: 'list',
        ordered: true,
        items: ['Prepare your questions.', 'Contact the team.'],
      },
      {
        type: 'quote',
        text: 'Start with a clear brief.',
        cite: 'Sample editorial note',
      },
      {
        type: 'image',
        media: {
          id: 'sample-logo',
          alt: 'Smoke Show Labs logo',
          width: 2400,
          height: 320,
        },
        caption: 'Locally bundled brand asset.',
      },
    ],
  }),
)
export const fixtureMedia = { 'sample-logo': '/brand/ss-logo.png' } as const
