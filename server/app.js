import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import apiRouter from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

// Security & settings
app.disable('x-powered-by')

// Core middlewares
app.use(
  cors({
    origin: true, // Reflect request origin to allow localhost:5173, etc.
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '12mb' }))

// API Routes
app.use('/api', apiRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Centralized error handler
app.use(errorHandler)

export default app
