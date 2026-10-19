// Test-only no-op for the `server-only` marker package.
//
// Vitest runs in a plain Node environment without the `react-server` export
// condition, so importing the real package throws at import time. Alias
// `server-only` to this file in vitest.config.mts so server modules can be
// unit-tested. Next.js still resolves the real package at build time.
export {}
