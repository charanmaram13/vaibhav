import { validateSession } from '../services/authService.js'

export function extractSessionToken(req) {
  return req.cookies?.vf_admin || null
}

export function requireAdmin(req, res, next) {
  const token = extractSessionToken(req)
  const session = validateSession(token)

  if (!session) {
    return res.status(401).json({ error: 'Please sign in to manage products.' })
  }

  req.adminSession = { token, ...session }
  next()
}
