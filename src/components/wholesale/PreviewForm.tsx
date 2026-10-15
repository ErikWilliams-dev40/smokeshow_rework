'use client'

import { useSyncExternalStore, type ComponentProps } from 'react'
import { salesContact } from '@/content/splash'
import styles from './PreviewForm.module.css'

const subscribe = () => () => {}

/** A preview must never fall back to a native form submission before hydration. */
export function PreviewForm({ children, ...props }: ComponentProps<'form'>) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return (
    <form {...props} noValidate>
      {!ready ? (
        <p className={styles.fallback}>
          This signup preview needs JavaScript. You can also{' '}
          <a href={salesContact.email.href}>email our team</a>.
        </p>
      ) : null}
      <fieldset className={styles.fields} disabled={!ready}>
        {children}
      </fieldset>
    </form>
  )
}
