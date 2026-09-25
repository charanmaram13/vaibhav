import { Router } from 'express'
import { checkSession, login, logout } from '../controllers/authController.js'

const router = Router()

router.post('/login', login)
router.get('/session', checkSession)
router.post('/logout', logout)

export default router
