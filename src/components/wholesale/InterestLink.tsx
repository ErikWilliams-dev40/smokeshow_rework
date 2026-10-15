'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { interests } from '@/content/wholesale'
import { saveDraft } from './draft'

export function InterestLink({
  interest,
  children,
  className,
}: {
  interest: (typeof interests)[number]
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href="/wholesale"
      className={className}
      onClick={() => saveDraft({ interest })}
    >
      {children}
    </Link>
  )
}
