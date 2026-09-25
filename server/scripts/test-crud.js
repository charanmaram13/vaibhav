import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { connectDB } from '../config/db.js'
import Product from '../models/Product.js'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js'

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.data = data
      return this
    }
  }
  return res
}

async function run() {
  await connectDB()

  // 1. Test getProducts
  console.log('--- TEST 1: getProducts ---')
  const res1 = mockRes()
  await getProducts({}, res1, (err) => { if (err) console.error('Next err:', err) })
  console.log('getProducts returned count:', res1.data?.length)

  // 2. Test createProduct
  console.log('--- TEST 2: createProduct ---')
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const reqCreate = {
    body: {
      name: 'Test Cotton Shirt',
      category: 'Men',
      price: 899,
      salePrice: 799,
      sizes: ['M', 'L'],
      description: 'Test description',
      image: tinyPng,
      isNewArrival: true,
      isFeatured: false,
    }
  }
  const res2 = mockRes()
  await createProduct(reqCreate, res2, (err) => { if (err) console.error('Next err create:', err) })
  console.log('createProduct status:', res2.statusCode, 'data:', res2.data)

  const createdId = res2.data?.id
  if (!createdId) {
    console.error('Failed to create product!')
    process.exit(1)
  }

  // 3. Test updateProduct
  console.log('--- TEST 3: updateProduct ---')
  const reqUpdate = {
    params: { id: createdId },
    body: {
      name: 'Updated Cotton Shirt',
      category: 'Men',
      price: 999,
      salePrice: 849,
      sizes: ['M', 'L', 'XL'],
      description: 'Updated description',
      image: res2.data.image, // Same stored image URL (/api/images/...)
      isNewArrival: false,
      isFeatured: true,
    }
  }
  const res3 = mockRes()
  await updateProduct(reqUpdate, res3, (err) => { if (err) console.error('Next err update:', err) })
  console.log('updateProduct status:', res3.statusCode, 'data:', res3.data)

  // 4. Test deleteProduct
  console.log('--- TEST 4: deleteProduct ---')
  const reqDelete = {
    params: { id: createdId }
  }
  const res4 = mockRes()
  await deleteProduct(reqDelete, res4, (err) => { if (err) console.error('Next err delete:', err) })
  console.log('deleteProduct status:', res4.statusCode, 'data:', res4.data)

  console.log('--- ALL CONTROLLER TESTS FINISHED ---')
}

run().catch(console.error).finally(() => process.exit(0))
