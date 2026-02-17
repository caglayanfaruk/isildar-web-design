import React from 'react';
import ProductCategories from '../components/ProductCategories';

const ProductsPage = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-32">
      {/* Hero Section */}
      

      {/* Product Categories */}
      <div className="py-8">
        <ProductCategories />
      </div>
    </div>
  );
};

export default ProductsPage;