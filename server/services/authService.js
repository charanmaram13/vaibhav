import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_LOGIN_ATTEMPTS = 8

const sessions = new Map()
const loginAttempts = new Map()

export function checkRateLimit(ip) {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW }

  if (attempts.resetAt < now) {
    attempts.count = 0
    attempts.resetAt = now + RATE_LIMIT_WINDOW
    loginAttempts.set(ip, attempts)
  }

  return attempts.count < MAX_LOGIN_ATTEMPTS
}

export function recordFailedAttempt(ip) {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW }

  if (attempts.resetAt < now) {
    attempts.count = 1
    attempts.resetAt = now + RATE_LIMIT_WINDOW
  } else {
    attempts.count += 1
  }

  loginAttempts.set(ip, attempts)
}

export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip)
}

export function verifyCredentials(submittedUsername, submittedPassword) {
  const username = process.env.ADMIN_USERNAME
  const passwordSalt = process.env.ADMIN_PASSWORD_SALT
  const passwordHash = process.env.ADMIN_PASSWORD_HASH

  if (!username || !passwordSalt || !passwordHash) {
    throw new Error('Admin credentials are not configured in environment variables.')
  }

  const userMatches = String(submittedUsername || '') === username

  const candidateHash = scryptSync(String(submittedPassword || ''), passwordSalt, 64)
  const expectedHash = Buffer.from(passwordHash, 'hex')

  const passwordMatches =
    expectedHash.length === candidateHash.length &&
    timingSafeEqual(candidateHash, expectedHash)

  return userMatches && passwordMatches
}

export function createSession() {
  const token = randomBytes(32).toString('base64url')
  const sessionData = {
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  }

  sessions.set(token, sessionData)
  return token
}

export function validateSession(token) {
  if (!token) return null

  const session = sessions.get(token)
  if (!session) return null

  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }

  return session
}

export function destroySession(token) {
  if (token) {
    sessions.delete(token)
  }
}
