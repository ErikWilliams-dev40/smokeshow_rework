import Image from 'next/image'
import type { Block, Media } from '@/domain/article'
import styles from './Blog.module.css'

export function ArticleImage({
  media,
  priority = false,
}: {
  media: Media
  priority?: boolean
}) {
  return (
    <Image
      className={styles.image}
      src={`/blog/media/${media.id}`}
      alt={media.alt}
      width={media.width}
      height={media.height}
      unoptimized
      priority={priority}
    />
  )
}
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className={styles.body}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index}>{block.text}</p>
          case 'heading':
            return block.level === 2 ? (
              <h2 key={index}>{block.text}</h2>
            ) : (
              <h3 key={index}>{block.text}</h3>
            )
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
              <Tag key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </Tag>
            )
          }
          case 'quote':
            return (
              <blockquote key={index}>
                <p>{block.text}</p>
                {block.cite && <cite>{block.cite}</cite>}
              </blockquote>
            )
          case 'image':
            return (
              <figure key={index}>
                <ArticleImage media={block.media} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            )
        }
      })}
    </div>
  )
}
