import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-img">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
        ) : (
          <span>🏔️</span>
        )}
      </div>
      <div className="product-title">{product.name}</div>
      <div className="product-desc">{product.description}</div>
      <div className="product-footer">
        <span className="product-price">¥{product.price.toLocaleString()}/人</span>
        <button className="book-btn" onClick={() => window.open(product.detailUrl, '_blank')}>查看详情 →</button>
      </div>
    </div>
  );
};

export default ProductCard;