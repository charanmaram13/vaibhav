import 'dotenv/config'
import dotenv from 'dotenv'
import app from './app.js'
import { connectDB } from './config/db.js'

dotenv.config({ path: '../.env' })

const port = process.env.PORT || 4000

try {
  await connectDB()
  app.listen(port, () => {
    console.log(`🚀 Sri Vaibhav Fashions API listening on http://localhost:${port}`)
  })
} catch (error) {
  console.error('❌ Failed to start server:', error.message)
  process.exit(1)
}
