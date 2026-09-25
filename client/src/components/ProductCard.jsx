import { useState } from 'react'

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85'

export default function ProductCard({ product, onSelect }) {
  if (!product) return null

  const [imageLoaded, setImageLoaded] = useState(false)
  const displayImage = product.image || product.images?.[0] || DEFAULT_IMAGE
  const secondaryImage = product.images?.[1] || product.secondaryImage

  return (
    <article className="product-card">
      <button
        className={`product-image-wrap ${imageLoaded ? 'image-loaded' : ''}`}
        onClick={() => onSelect(product)}
        aria-label={`View ${product.name}`}
      >
        <img
          className="product-front"
          src={displayImage}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={e => {
            e.currentTarget.src = DEFAULT_IMAGE
            setImageLoaded(true)
          }}
        />
        {secondaryImage && (
          <img
            className="product-back"
            src={secondaryImage}
            alt={`${product.name}, alternate view`}
            loading="lazy"
            onError={e => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        {(product.isFeatured || product.isNewArrival || product.badge) && (
          <span className="product-badge">{product.isFeatured ? 'FEATURED' : 'NEW'}</span>
        )}
      </button>
      <div className="product-info">
        <h3>{product.name}</h3>
        <div className="product-prices">
          {product.salePrice && <del>₹{Number(product.price).toLocaleString('en-IN')}</del>}
          <strong>₹{Number(product.salePrice || product.price).toLocaleString('en-IN')}</strong>
        </div>
      </div>
      <div className="product-sizes" aria-label={`Sizes available: ${(product.sizes || []).join(', ')}`}>
        {(product.sizes || []).slice(0, 5).map(size => (
          <span key={size}>{size}</span>
        ))}
      </div>
    </article>
  )
}
