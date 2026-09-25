import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../controllers/productController.js'
import { requireAdmin } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', getProducts)
router.post('/', requireAdmin, createProduct)
router.put('/:id', requireAdmin, updateProduct)
router.delete('/:id', requireAdmin, deleteProduct)

export default router
