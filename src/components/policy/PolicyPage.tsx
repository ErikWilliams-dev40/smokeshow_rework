import Link from 'next/link'
import { Fragment } from 'react'

import type { PolicyBlock, PolicyInline, PolicyPageCopy } from '@/content/policies'

import styles from './PolicyPage.module.css'

/**
 * Shared layout for public policy pages. Deliberately outside the
 * age gate: a visitor deciding whether to enter is entitled to read these.
 */
export function PolicyPage({ copy }: { copy: PolicyPageCopy }) {
  return (
    <main className={styles.page}>
      <p className={styles.back}>
        <Link className="sl" href="/">
          Smoke Show Labs
        </Link>
      </p>
      {copy.brand ? <p className={styles.brand}>{copy.brand}</p> : null}
      <h1 className={styles.title}>{copy.title}</h1>
      {copy.effectiveDate ? (
        <p className={styles.body}>
          <em>
            <time dateTime={copy.effectiveDate.dateTime}>
              {copy.effectiveDate.label}
            </time>
          </em>
        </p>
      ) : null}
      <PolicyBlocks blocks={copy.introduction ?? []} />
      {copy.sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          <PolicyBlocks blocks={section.blocks} />
        </section>
      ))}
      {copy.copyright ? <p className={styles.body}>{copy.copyright}</p> : null}
    </main>
  )
}

function PolicyInlines({ content }: { content: readonly PolicyInline[] }) {
  return content.map((part, index) => (
    <Fragment key={index}>
      {typeof part === 'string' ? (
        part
      ) : 'emphasis' in part ? (
        <em>{part.emphasis}</em>
      ) : 'href' in part ? (
        <a href={part.href}>{part.label}</a>
      ) : (
        <br />
      )}
    </Fragment>
  ))
}

function PolicyBlocks({ blocks }: { blocks: readonly PolicyBlock[] }) {
  return blocks.map((block, index) =>
    block.kind === 'paragraph' ? (
      <p key={index} className={styles.body}>
        <PolicyInlines content={block.content} />
      </p>
    ) : (
      <ul key={index} className={styles.list}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>
            <PolicyInlines content={item} />
          </li>
        ))}
      </ul>
    ),
  )
}
