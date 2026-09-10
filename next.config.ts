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

  // `next dev` otherwise appends a `nextjs-agent-rules` block to CLAUDE.md on
  // every run. CLAUDE.md is this repository's governance document — it carries
  // the lifecycle rules, the review gates and the deploy policy — and a
  // framework that rewrites it on each dev-server start both muddies which
  // instructions the repo actually authored and leaves an uncommitted change in
  // every working tree. Turning the generation off keeps that file
  // human-authored; the framework's own guidance stays available where it is
  // written, in node_modules/next/dist/docs/.
  agentRules: false,

  images: {
    remotePatterns: [],
  },
}

export default nextConfig
