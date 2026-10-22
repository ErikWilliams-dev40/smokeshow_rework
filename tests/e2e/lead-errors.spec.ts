import { expect, test } from '@playwright/test'
test('failed submission retains an idempotency key and does not show success', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  const keys: string[] = []
  await page.route('**/api/leads', (route) => {
    const data = route.request().postDataJSON() as { submissionId: string }
    keys.push(data.submissionId)
    return route.fulfill(
      keys.length === 1
        ? { status: 503, json: { error: 'Please try again.' } }
        : { status: 202, json: { status: 'pending', delivery: 'queued' } },
    )
  })
  await page.goto('/wholesale')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('test@example.test')
  await page.getByRole('textbox', { name: 'Your name' }).fill('Local Test')
  await page.getByRole('textbox', { name: 'Phone' }).fill('5551234567')
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect(page.getByRole('alert')).toHaveText('Please try again.')
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[1]).toBe(keys[0])
})
