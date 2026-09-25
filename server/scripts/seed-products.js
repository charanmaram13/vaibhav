import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dns from 'node:dns'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { products } from '../data/products.js'

try {
  dns.setDefaultResultOrder?.('ipv4first')
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(__dirname, '..')

// Load environment variables
dotenv.config({ path: path.resolve(serverDir, '.env') })
dotenv.config({ path: path.resolve(serverDir, '../.env') })

const databaseName = process.env.MONGODB_DB || 'sri_vaibhav_fashions'

async function main() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error('MONGODB_URI is missing from environment variables.')
  }

  if (!Array.isArray(products) || products.length === 0) {
    console.log('No starter products found.')
    return
  }

  console.log(`Connecting to MongoDB (${databaseName}) via Mongoose...`)
  await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 10000 })

  try {
    const operations = products.map(product => ({
      updateOne: {
        filter: { id: product.id },
        update: { $setOnInsert: product },
        upsert: true,
      },
    }))

    const result = await Product.bulkWrite(operations, { ordered: true })
    console.log(
      `✅ Seeding complete: ${result.upsertedCount} new products inserted out of ${products.length} source items.`
    )
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB disconnected.')
  }
}

main().catch(error => {
  console.error('❌ Product seeding failed:', error.message)
  process.exitCode = 1
})
