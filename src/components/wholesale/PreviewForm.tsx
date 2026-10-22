'use client'

import { useSyncExternalStore, type ComponentProps } from 'react'
import { salesContact } from '@/content/splash'
import styles from './PreviewForm.module.css'

const subscribe = () => () => {}

/** Signup must never fall back to a native form submission before hydration. */
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
          This signup needs JavaScript. You can also{' '}
          <a href={salesContact.email.href}>email our team</a>.
        </p>
      ) : null}
      <fieldset
        className={styles.fields}
        disabled={!ready || props['aria-busy'] === true}
      >
        <label className={styles.trap} aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        {children}
      </fieldset>
    </form>
  )
}
