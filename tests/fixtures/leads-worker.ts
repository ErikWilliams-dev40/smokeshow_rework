// Runtime integration entrypoint. These routes are never part of the app build.
import { GET as health } from '@/app/api/health/route'
import { leadRequest } from '@/server/leads/http'
import { deliverPending, reportDeliveryHealth } from '@/server/leads/delivery'

export default {
  fetch(request) {
    const path = new URL(request.url).pathname
    if (path === '/api/health') return health()
    if (request.method !== 'POST') return new Response(null, { status: 405 })
    const action = {
      '/api/leads': 'submit',
      '/api/leads/status': 'status',
      '/api/leads/resend': 'resend',
      '/api/leads/verify': 'verify',
    }[path] as 'submit' | 'status' | 'resend' | 'verify' | undefined
    return action ? leadRequest(request, action) : new Response(null, { status: 404 })
  },
  async scheduled() {
    await deliverPending()
    await reportDeliveryHealth()
  },
} satisfies ExportedHandler<Env>
