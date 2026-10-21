import { expect, test } from 'vitest'
import { hashToken, isSessionExpired, SESSION_IDLE_TIMEOUT_MS, SESSION_MAX_AGE_MS } from '../lib/auth'
import { checkRateLimit } from '../lib/rate-limit'

test('hashToken produces consistent SHA-256 hex digest', () => {
  const token = 'my-secret-token-123'
  const h1 = hashToken(token)
  const h2 = hashToken(token)
  expect(h1).toBe(h2)
  expect(h1.length).toBe(64)
})

test('checkRateLimit allows up to maxAttempts and blocks excess', () => {
  const key = 'test-ip:test@test.com'
  for (let i = 0; i < 5; i++) {
    expect(checkRateLimit(key, 5, 60000)).toBe(true)
  }
  expect(checkRateLimit(key, 5, 60000)).toBe(false)
})

test('isSessionExpired accepts a fresh session', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const session = {
    createdAt: new Date(now.getTime() - 60_000),
    expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_MS),
    revokedAt: null,
  }
  expect(isSessionExpired(session, now)).toBe(false)
})

test('isSessionExpired rejects a revoked session', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const session = {
    createdAt: new Date(now.getTime() - 60_000),
    expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_MS),
    revokedAt: new Date(now.getTime() - 1_000),
  }
  expect(isSessionExpired(session, now)).toBe(true)
})

test('isSessionExpired rejects a session past its maximum lifetime', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const session = {
    createdAt: new Date(now.getTime() - SESSION_MAX_AGE_MS - 1_000),
    expiresAt: new Date(now.getTime() - 1_000),
    revokedAt: null,
  }
  expect(isSessionExpired(session, now)).toBe(true)
})

test('isSessionExpired rejects an idle session past the timeout', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const session = {
    createdAt: new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS - 1_000),
    expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_MS),
    revokedAt: null,
  }
  expect(isSessionExpired(session, now)).toBe(true)
})
