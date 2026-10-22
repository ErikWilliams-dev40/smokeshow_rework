import { leadRequest } from '@/server/leads/http'
export const POST = (request: Request) => leadRequest(request, 'submit')
