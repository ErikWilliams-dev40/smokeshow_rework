import { ConfirmEmail } from '@/components/wholesale/ConfirmEmail'
import { pageMetadata } from '@/server/seo/metadata'
export function generateMetadata() {
  return {
    ...pageMetadata('/verify-email', 'Confirm your email', undefined, false),
    referrer: 'no-referrer' as const,
  }
}
export default function VerifyEmailPage() {
  return (
    <main style={{ maxWidth: '48rem', margin: '4rem auto', padding: '1.5rem' }}>
      <ConfirmEmail />
    </main>
  )
}
