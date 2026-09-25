import {
  SESSION_DURATION,
  checkRateLimit,
  clearLoginAttempts,
  createSession,
  destroySession,
  recordFailedAttempt,
  validateSession,
  verifyCredentials,
} from '../services/authService.js'
import { extractSessionToken } from '../middlewares/authMiddleware.js'

export function login(req, res, next) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown'

    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Too many sign-in attempts. Wait 15 minutes and try again.',
      })
    }

    const { username, password } = req.body || {}

    const isValid = verifyCredentials(username, password)
    if (!isValid) {
      recordFailedAttempt(ip)
      return res.status(401).json({ error: 'Username or password is incorrect.' })
    }

    clearLoginAttempts(ip)
    const token = createSession()

    res.cookie('vf_admin', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION,
      secure: process.env.NODE_ENV === 'production',
    })

    res.json({ authenticated: true })
  } catch (error) {
    next(error)
  }
}

export function checkSession(req, res) {
  const token = extractSessionToken(req)
  const session = validateSession(token)
  res.json({ authenticated: Boolean(session) })
}

export function logout(req, res) {
  const token = extractSessionToken(req)
  if (token) {
    destroySession(token)
  }

  res.clearCookie('vf_admin', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  res.json({ authenticated: false })
}
