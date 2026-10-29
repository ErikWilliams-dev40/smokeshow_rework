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

for (const path of ['/', '/wholesale']) {
  test(`${path}: changed payloads get new keys and conflicts retain all fields`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
    const keys: string[] = []
    await page.route('**/api/leads', (route) => {
      keys.push(
        (route.request().postDataJSON() as { submissionId: string }).submissionId,
      )
      return route.fulfill(
        keys.length === 1
          ? { status: 503, json: { error: 'Lost response. Try again.' } }
          : keys.length === 2
            ? { status: 409, json: { error: 'Start a new inquiry.' } }
            : { status: 202, json: { status: 'pending', delivery: 'queued' } },
      )
    })
    await page.goto(path)
    const scope = path === '/' ? page.locator('#menu-signup') : page.locator('main')
    await scope
      .getByRole('textbox', { name: 'Email', exact: true })
      .fill('test@example.test')
    if (path === '/')
      await scope.getByRole('button', { name: 'Go', exact: true }).click()
    await scope.getByRole('textbox', { name: 'Your name' }).fill('Original')
    await scope.getByRole('textbox', { name: 'Phone' }).fill('5551234567')
    const submit = scope.getByRole('button', { name: 'Send verification email' })
    await submit.click()
    await expect(scope.getByRole('alert')).toContainText('Lost response')
    await scope.getByRole('textbox', { name: 'Your name' }).fill('Edited')
    await submit.click()
    await expect(scope.getByRole('alert')).toContainText('Start a new inquiry')
    expect(keys[1]).not.toBe(keys[0])
    await scope
      .getByRole('button', { name: 'Start a new inquiry with these details' })
      .click()
    await expect(scope.getByRole('textbox', { name: 'Your name' })).toHaveValue(
      'Edited',
    )
    await expect(scope.getByRole('textbox', { name: 'Phone' })).toHaveValue(
      '5551234567',
    )
    await submit.click()
    await expect(scope.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
    expect(keys[2]).not.toBe(keys[1])
  })
}

test('immediate duplicate submits send once and malformed success stays retryable', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  const keys: string[] = []
  await page.route('**/api/leads', (route) => {
    keys.push((route.request().postDataJSON() as { submissionId: string }).submissionId)
    return route.fulfill({ status: 202, json: { status: 'pending' } })
  })
  await page.goto('/wholesale')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('test@example.test')
  await page.getByRole('textbox', { name: 'Your name' }).fill('Buyer')
  await page.getByRole('textbox', { name: 'Phone' }).fill('5551234567')
  await page.locator('main form').evaluate((form) => {
    for (let n = 0; n < 2; n++)
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  await expect(page.getByRole('alert')).toContainText('verify the response')
  expect(keys).toHaveLength(1)
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect(page.getByRole('alert')).toContainText('verify the response')
  expect(keys).toHaveLength(2)
  expect(keys[1]).toBe(keys[0])
})

test('confirmation retains its private token after failure and requires confirmed status', async ({
  page,
}) => {
  const tokens: string[] = []
  await page.route('**/api/leads/verify', (route) => {
    tokens.push((route.request().postDataJSON() as { token: string }).token)
    return route.fulfill({
      status: 200,
      json:
        tokens.length === 1
          ? { status: 'pending', delivery: 'queued' }
          : { status: 'confirmed', delivery: 'sent' },
    })
  })
  await page.goto('/verify-email#private-test-token')
  const button = page.getByRole('button', { name: 'Confirm email', exact: true })
  await expect(button).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
  await button.click()
  await expect(page.getByRole('status')).toContainText('verify the response')
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toHaveCount(0)
  await button.click()
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()
  expect(tokens).toEqual(['private-test-token', 'private-test-token'])
})

test('stalled form requests expire and allow an unchanged retry', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  const keys: string[] = []
  await page.route('**/api/leads', (route) => {
    keys.push((route.request().postDataJSON() as { submissionId: string }).submissionId)
    if (keys.length > 1)
      return route.fulfill({
        status: 202,
        json: { status: 'pending', delivery: 'queued' },
      })
  })
  await page.goto('/wholesale')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('test@example.test')
  await page.getByRole('textbox', { name: 'Your name' }).fill('Buyer')
  await page.getByRole('textbox', { name: 'Phone' }).fill('5551234567')
  await page.clock.install()
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect.poll(() => keys.length).toBe(1)
  await page.clock.fastForward(31000)
  await expect(page.getByRole('alert')).toContainText('too long')
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  expect(keys[1]).toBe(keys[0])
})
