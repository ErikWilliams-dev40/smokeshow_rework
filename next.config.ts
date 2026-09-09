import type { NextConfig } from 'next'

/**
 * The design handoff forbids external requests: no CDN, no analytics, no
 * third-party anything. `images.remotePatterns` is deliberately left empty so
 * `next/image` can only serve files vendored into `public/`. If a remote host
 * ever appears here, that is a change to the handoff's asset policy and needs
 * to be argued for in its own pull request.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
