import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be non-negative'],
    },
    sizes: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    tone: {
      type: String,
      trim: true,
      default: '',
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    salePrice: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: false,
    versionKey: false,
    strict: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

export default Product
