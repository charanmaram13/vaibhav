import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const { default: app } = await import('../app.js')
const { connectDB } = await import('../config/db.js')

let server

async function run() {
  await connectDB()

  await new Promise((resolve) => {
    server = app.listen(4001, () => {
      console.log('Test server running on port 4001')
      resolve()
    })
  })

  const baseUrl = 'http://localhost:4001/api'

  // 1. Test Admin Login
  console.log('1. Testing Admin Login with vaibhavFashions / admin123...')
  const loginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'vaibhavFashions', password: 'admin123' })
  })
  const loginData = await loginRes.json()
  console.log('Login status:', loginRes.status, 'Response:', loginData)
  if (!loginData.authenticated || !loginData.token) {
    throw new Error('Login failed!')
  }
  const token = loginData.token

  // 2. Test Session Validation with Bearer Token
  console.log('2. Testing Session Validation with Bearer Token...')
  const sessionRes = await fetch(`${baseUrl}/admin/session`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const sessionData = await sessionRes.json()
  console.log('Session response:', sessionData)
  if (!sessionData.authenticated) {
    throw new Error('Session verification failed!')
  }

  // 3. Test Create Product
  console.log('3. Testing Product Creation...')
  const createRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Automated Test Shirt',
      category: 'Men',
      price: 1299,
      salePrice: 999,
      sizes: ['M', 'L'],
      description: 'Testing add product flow',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85',
      isNewArrival: true,
      isFeatured: false
    })
  })
  const createData = await createRes.json()
  console.log('Create product status:', createRes.status, 'Created ID:', createData.id)
  if (!createData.id) {
    throw new Error('Product creation failed: ' + JSON.stringify(createData))
  }
  const productId = createData.id

  // 4. Test Get Products (Home page listing)
  console.log('4. Testing Product Listing...')
  const getRes = await fetch(`${baseUrl}/products`)
  const products = await getRes.json()
  const found = products.find(p => p.id === productId)
  console.log('Total products on home page:', products.length, 'Created product found:', Boolean(found))
  if (!found) {
    throw new Error('Created product was not found in home page listing!')
  }

  // 5. Test Update Product
  console.log('5. Testing Product Update...')
  const updateRes = await fetch(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Automated Test Shirt (Updated)',
      category: 'Kids',
      price: 1499,
      salePrice: 1199,
      sizes: ['4–5Y'],
      description: 'Updated description',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85',
      isNewArrival: false,
      isFeatured: true
    })
  })
  const updateData = await updateRes.json()
  console.log('Update product status:', updateRes.status, 'Updated name:', updateData.name, 'Category:', updateData.category)
  if (updateData.name !== 'Automated Test Shirt (Updated)') {
    throw new Error('Update failed!')
  }

  // 6. Test Delete Product
  console.log('6. Testing Product Deletion...')
  const deleteRes = await fetch(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  const deleteData = await deleteRes.json()
  console.log('Delete product status:', deleteRes.status, 'Response:', deleteData)
  if (!deleteData.deleted) {
    throw new Error('Delete failed!')
  }

  // 7. Test Admin Logout
  console.log('7. Testing Admin Logout...')
  const logoutRes = await fetch(`${baseUrl}/admin/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  const logoutData = await logoutRes.json()
  console.log('Logout status:', logoutRes.status, 'Response:', logoutData)

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!')
}

run()
  .catch(err => {
    console.error('❌ Test failed with error:', err)
    process.exitCode = 1
  })
  .finally(() => {
    if (server) server.close()
    process.exit()
  })
