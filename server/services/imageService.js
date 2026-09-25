import mongoose from 'mongoose'

let gridFSBucket = null

export function getGridFSBucket() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('Database is not connected. Configure MONGODB_URI to enable image storage.')
  }

  if (!gridFSBucket || gridFSBucket.s?.db !== mongoose.connection.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'productImages',
    })
  }

  return gridFSBucket
}

export async function storeProductImage(image) {
  if (!image || !image.startsWith('data:image/')) {
    return image
  }

  const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,\s*([A-Za-z0-9+/=\s]+)$/i)
  if (!match) {
    throw new Error('Choose a JPEG, PNG, or WebP product photo.')
  }

  const cleanBase64 = match[2].replace(/\s+/g, '')
  const buffer = Buffer.from(cleanBase64, 'base64')
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Product photos must be 5 MB or smaller.')
  }

  const bucket = getGridFSBucket()

  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(`product-${Date.now()}`, {
      metadata: { contentType: match[1] },
    })

    upload.once('error', reject)
    upload.once('finish', () => resolve(`/api/images/${upload.id.toString()}`))
    upload.end(buffer)
  })
}

export async function deleteStoredImage(image) {
  const match = image?.match(/^\/api\/images\/([a-f\d]{24})$/i)
  if (!match || mongoose.connection.readyState !== 1) return

  try {
    const bucket = getGridFSBucket()
    await bucket.delete(new mongoose.Types.ObjectId(match[1]))
  } catch (error) {
    if (error.code !== 'ENOENT' && error.message !== 'FileNotFound') {
      console.error('Could not remove old product photo:', error.message)
    }
  }
}

export async function getImageFileAndStream(idString) {
  if (!mongoose.Types.ObjectId.isValid(idString)) {
    return null
  }

  const bucket = getGridFSBucket()
  const objectId = new mongoose.Types.ObjectId(idString)
  const files = await bucket.find({ _id: objectId }).limit(1).toArray()

  if (!files || files.length === 0) {
    return null
  }

  return {
    file: files[0],
    stream: bucket.openDownloadStream(objectId),
  }
}
