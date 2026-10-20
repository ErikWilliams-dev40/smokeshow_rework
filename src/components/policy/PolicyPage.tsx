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
        <a className="sl" href="/">
          Smoke Show Labs
        </a>
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
      {copy.placeholder ? (
        <p className={styles.notice} role="note">
          {copy.notice}
        </p>
      ) : null}
      {copy.sections.map((section) => {
        const heading = typeof section === 'string' ? section : section.heading
        return (
          <section key={heading} className={styles.section}>
            <h2 className={styles.heading}>{heading}</h2>
            {copy.placeholder ? (
              <p className={styles.pending}>Text to follow.</p>
            ) : null}
            {typeof section !== 'string' ? (
              <PolicyBlocks blocks={section.blocks} />
            ) : null}
          </section>
        )
      })}
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
