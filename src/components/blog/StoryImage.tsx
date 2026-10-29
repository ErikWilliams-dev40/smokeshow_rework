'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Media } from '@/domain/article'
import styles from './Blog.module.css'

/** Images stay visible without JS; the fade starts only after the image loads. */
export function StoryImage({ media, priority }: { media?: Media; priority: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className={styles.storyImage}>
      {media && !failed ? (
        <Image
          src={`/smokesignals/media/${media.id}`}
          alt={media.alt}
          width={media.width}
          height={media.height}
          priority={priority}
          unoptimized
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}
    </div>
  )
}
