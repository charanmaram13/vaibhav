import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { deleteStoredImage, storeProductImage } from '../services/imageService.js'
import { products as starterProducts } from '../data/products.js'

function buildIdQuery(id) {
  const conditions = [{ id }]
  if (mongoose.Types.ObjectId.isValid(id)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(id) })
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

    // Ensure every product has a valid id property
    const formatted = products.map(p => {
      const id = p.id || (p._id ? p._id.toString() : `product-${randomBytes(6).toString('hex')}`)
      const { _id, __v, ...rest } = p
      return { ...rest, id }
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
    if (incoming.image !== existing.image) {
      storedImageUrl = await storeProductImage(incoming.image)
      await deleteStoredImage(existing.image)
    }

    const updated = await Product.findOneAndUpdate(
      query,
      {
        ...incoming,
        id: existing.id || id,
        name: incoming.name.trim(),
        price,
        image: storedImageUrl,
      },
      { new: true, runValidators: true }
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
    await deleteStoredImage(existing.image)

    res.json({ deleted: true })
  } catch (error) {
    next(error)
  }
}
