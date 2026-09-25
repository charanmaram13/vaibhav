import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { deleteStoredImage, storeProductImage } from '../services/imageService.js'
import { products as starterProducts } from '../data/products.js'

function normalizeCategory(cat) {
  if (!cat) return 'Men'
  const c = String(cat).trim()
  if (/kid/i.test(c)) return 'Kids'
  if (/men/i.test(c)) return 'Men'
  return c
}

function extractImageId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/\/api\/images\/([a-f\d]{24})/i)
  return match ? match[1] : null
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85'

function buildIdQuery(id) {
  if (!id) return { _id: null }
  const cleanId = String(id).trim()
  const conditions = [{ id: cleanId }]
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(cleanId) })
  }
  return { $or: conditions }
}

export async function getProducts(_req, res, next) {
  try {
    let products = await Product.find().sort({ createdAt: -1 }).lean()
    if (!products.length) {
      await Product.insertMany(starterProducts)
      products = await Product.find().sort({ createdAt: -1 }).lean()
    }

    // Ensure every product has a valid id property, normalized category, and fallback image
    const formatted = products.map(p => {
      const id = p.id || (p._id ? p._id.toString() : `product-${randomBytes(6).toString('hex')}`)
      const { _id, __v, ...rest } = p
      return {
        ...rest,
        id,
        category: normalizeCategory(p.category),
        image: p.image || p.images?.[0] || DEFAULT_FALLBACK_IMAGE,
      }
    })

    res.json(formatted)
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const payload = req.body
    if (!payload?.name?.trim() || !Number.isFinite(Number(payload.price)) || !payload.image) {
      return res.status(400).json({ error: 'A product name, valid price, and image are required.' })
    }

    const price = Number(payload.price)
    if (price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' })
    }

    const productId = payload.id?.trim() || `product-${randomBytes(8).toString('hex')}`
    const storedImageUrl = await storeProductImage(payload.image)

    const product = await Product.create({
      ...payload,
      id: productId,
      name: payload.name.trim(),
      category: normalizeCategory(payload.category),
      price,
      image: storedImageUrl,
      createdAt: payload.createdAt || Date.now(),
    })

    res.status(201).json(product.toJSON())
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params
    const incoming = req.body

    if (!incoming?.name?.trim() || !Number.isFinite(Number(incoming.price)) || !incoming.image) {
      return res.status(400).json({ error: 'A product name, valid price, and image are required.' })
    }

    const price = Number(incoming.price)
    if (price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' })
    }

    const query = buildIdQuery(id)
    const existing = await Product.findOne(query)
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    let storedImageUrl = existing.image
    const incomingImage = String(incoming.image).trim()
    const incomingGridFsId = extractImageId(incomingImage)
    const existingGridFsId = extractImageId(existing.image)

    // Check if a new base64 image was uploaded
    if (incomingImage.startsWith('data:image/')) {
      storedImageUrl = await storeProductImage(incomingImage)
      if (existing.image) {
        await deleteStoredImage(existing.image)
      }
    } else if (incomingGridFsId && existingGridFsId && incomingGridFsId === existingGridFsId) {
      // Same GridFS image, retain the clean internal relative path
      storedImageUrl = existing.image.startsWith('/api/')
        ? existing.image
        : `/api/images/${existingGridFsId}`
    } else if (incomingImage !== existing.image) {
      // Changed to a different URL
      storedImageUrl = incomingImage
      if (existingGridFsId) {
        await deleteStoredImage(existing.image)
      }
    }

    const updated = await Product.findOneAndUpdate(
      query,
      {
        ...incoming,
        id: existing.id || id,
        name: incoming.name.trim(),
        category: normalizeCategory(incoming.category),
        price,
        image: storedImageUrl,
      },
      { returnDocument: 'after', runValidators: true }
    ).select('-_id -__v').lean()

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params
    const query = buildIdQuery(id)
    const existing = await Product.findOne(query)

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    await Product.deleteOne(query)
    if (existing.image) {
      await deleteStoredImage(existing.image)
    }

    res.json({ deleted: true })
  } catch (error) {
    next(error)
  }
}

