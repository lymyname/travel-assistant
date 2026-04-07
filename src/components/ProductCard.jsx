import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} [imageUrl]
 * @property {string} detailUrl
 */

/**
 * @param {{ product: Product }} props
 */
const ProductCard = memo(({ product }) => {
  const handleViewDetails = () => {
    if (product.detailUrl) {
      window.open(product.detailUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article className="product-card" aria-label={`旅游产品: ${product.name}`}>
      <div className="product-img">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
          />
        ) : (
          <span aria-hidden="true">🏔️</span>
        )}
      </div>
      <h3 className="product-title">{product.name}</h3>
      <p className="product-desc">{product.description}</p>
      <div className="product-footer">
        <span className="product-price" aria-label={`价格: ${product.price}元每人`}>
          ¥{product.price.toLocaleString()}/人
        </span>
        <button
          className="book-btn"
          onClick={handleViewDetails}
          aria-label={`查看 ${product.name} 详情`}
        >
          查看详情 →
        </button>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    imageUrl: PropTypes.string,
    detailUrl: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProductCard;