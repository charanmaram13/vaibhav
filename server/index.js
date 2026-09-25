import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const { default: app } = await import('./app.js')
const { connectDB } = await import('./config/db.js')

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
