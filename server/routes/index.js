import { Router } from 'express'
import productRoutes from './productRoutes.js'
import imageRoutes from './imageRoutes.js'
import authRoutes from './authRoutes.js'

const apiRouter = Router()

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sri-vaibhav-fashions-api' })
})

// Feature routes
apiRouter.use('/products', productRoutes)
apiRouter.use('/images', imageRoutes)
apiRouter.use('/admin', authRoutes)

export default apiRouter
