import { validateSession } from '../services/authService.js'

export function extractSessionToken(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
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

