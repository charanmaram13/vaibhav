export function errorHandler(err, req, res, next) {
  console.error('API Error:', err)

  if (res.headersSent) {
    return next(err)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message)
    return res.status(400).json({ error: messages.join(', ') })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A product with this identifier already exists.' })
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` })
  }

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'The request could not be completed.'

  res.status(statusCode).json({ error: message })
}
