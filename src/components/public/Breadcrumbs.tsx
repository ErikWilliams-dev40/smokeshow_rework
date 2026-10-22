import Link from 'next/link'
import type { Breadcrumb } from '@/domain/breadcrumbs'
import styles from './Public.module.css'
export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link href={item.path}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
