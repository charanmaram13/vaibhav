import mongoose from 'mongoose'
import dns from 'node:dns'

try {
  dns.setDefaultResultOrder?.('ipv4first')
} catch {}

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'sri_vaibhav_fashions'

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const conn = await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  })

  console.log(`Connected to MongoDB via Mongoose: ${conn.connection.host} (DB: ${dbName})`)
  return conn.connection
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1
}
