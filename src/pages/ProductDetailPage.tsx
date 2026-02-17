import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  FileText,
  Award,
  Globe,
  Package,
  Ruler,
  Truck,
  CheckCircle,
  X,
  Building,
  Camera
} from 'lucide-react';
import { getProductDetails, ProductDetail } from '../services/productService';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, t } = useTranslation();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (productSlug) {
      loadProduct();
    }
  }, [productSlug, currentLanguage]);

  const loadProduct = async () => {
    if (!productSlug) return;

    setLoading(true);
    try {
      const data = await getProductDetails(productSlug, currentLanguage);
      if (data) {
        setProduct(data);
      } else {
        toast.error('Ürün bulunamadı');
        navigate('/urunler');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (!product?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-44 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white pt-44 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ürün Bulunamadı</h1>
          <button
            onClick={() => navigate('/urunler')}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ürünlere Dön
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-black text-white pt-44">
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Ana Sayfa</button>
            <span>/</span>
            <button onClick={() => navigate('/urunler')} className="hover:text-white transition-colors">Ürünler</button>
            <span>/</span>
            <span className="text-white">{product.translations?.name || product.sku}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            {images.length > 0 ? (
              <>
                <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 group aspect-square">
                  <img
                    src={currentImage?.media?.url || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'}
                    alt={currentImage?.alt_text || product.translations?.name || product.sku}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => setIsImageModalOpen(true)}
                      className="bg-white/20 backdrop-blur-xl p-3 rounded-full border border-white/30 hover:scale-110 transition-transform duration-300"
                    >
                      <ZoomIn className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-xl p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-xl p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full text-white text-sm border border-white/30">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-3">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'border-white shadow-lg scale-105'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                      >
                        <img
                          src={image.media?.url}
                          alt={image.alt_text || `${product.translations?.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 aspect-square flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                  {product.category?.translations?.name || 'Kategori'}
                </span>
                {product.featured && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                    Öne Çıkan
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {product.translations?.name || 'Ürün Adı Girilmemiş'}
              </h1>

              <div className="flex items-center space-x-3 mb-4">
                <span className="text-sm text-gray-400">SKU:</span>
                <span className="bg-gray-800/50 text-white px-3 py-1 rounded font-mono text-sm font-semibold">
                  {product.sku}
                </span>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 mb-4">
                <h3 className="text-base font-bold text-white mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  {product.variants && product.variants.length > 0
                    ? 'Ürün Varyantları'
                    : 'Ürün Özellikleri'}
                </h3>
                {product.variants && product.variants.length > 0 && (
                  <p className="text-xs text-gray-400 mb-3">
                    Bu ürün grubunda {product.variants.length} farklı varyant bulunmaktadır.
                  </p>
                )}
                {product.variants && product.variants.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/20 bg-white/5">
                          <th className="text-left py-2 px-2 text-gray-300 font-semibold text-xs">
                            VARYANT KODU<br/><span className="text-gray-500">Variant Code</span>
                          </th>
                          <th className="text-left py-2 px-2 text-gray-300 font-semibold text-xs">
                            VARYANT ADI<br/><span className="text-gray-500">Variant Name</span>
                          </th>
                          {(() => {
                            const attributeMap = new Map<string, { id: string; name: string }>();
                            product.variants.forEach(v => {
                              v.attributes?.forEach((attr: any) => {
                                if (attr.attribute?.id && attr.attribute?.name) {
                                  attributeMap.set(attr.attribute.id, {
                                    id: attr.attribute.id,
                                    name: attr.attribute.name
                                  });
                                }
                              });
                            });
                            return Array.from(attributeMap.values()).map(attr => (
                              <th key={attr.id} className="text-left py-2 px-2 text-gray-300 font-semibold text-xs">
                                {t(`attribute.${attr.id}.name`, attr.name)}
                              </th>
                            ));
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant: any) => {
                          const customFields = variant.custom_fields || {};
                          const variantName = customFields.adi
                            || (variant.attributes && variant.attributes.length > 0
                              ? variant.attributes
                                  .filter((attr: any) => attr.attribute_value)
                                  .map((attr: any) => attr.attribute_value.display_value || attr.attribute_value.value)
                                  .join(' / ')
                              : variant.sku);
                          return (
                            <tr
                              key={variant.id}
                              className="border-b border-white/10 hover:bg-white/5 transition-colors duration-300 cursor-pointer"
                              onClick={() => navigate(`/urun/variant/${variant.sku}`)}
                            >
                              <td className="py-2 px-2">
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono text-xs font-bold hover:bg-blue-500/30 transition-colors duration-300">
                                  {variant.sku}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-white text-xs font-medium">
                                {variantName}
                              </td>
                              {(() => {
                                const attributeMap = new Map<string, { id: string; name: string }>();
                                product.variants.forEach(v => {
                                  v.attributes?.forEach((attr: any) => {
                                    if (attr.attribute?.id && attr.attribute?.name) {
                                      attributeMap.set(attr.attribute.id, {
                                        id: attr.attribute.id,
                                        name: attr.attribute.name
                                      });
                                    }
                                  });
                                });
                                return Array.from(attributeMap.values()).map(attr => {
                                  const variantAttr = variant.attributes?.find((a: any) => a.attribute?.id === attr.id);
                                  return (
                                    <td key={attr.id} className="py-2 px-2 text-gray-300 text-xs">
                                      {variantAttr ? (variantAttr.attribute_value?.display_value || variantAttr.attribute_value?.value) : '-'}
                                    </td>
                                  );
                                });
                              })()}
                            </tr>
                          );
                        })}
                          </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-400">
                        Detaylı bilgi için varyant koduna tıklayın
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {product.attributes && product.attributes.length > 0 ? (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20 bg-white/5">
                              <th className="text-left py-2 px-2 text-gray-300 font-semibold text-xs">
                                Özellik<br/><span className="text-gray-500">Attribute</span>
                              </th>
                              <th className="text-left py-2 px-2 text-gray-300 font-semibold text-xs">
                                Değer<br/><span className="text-gray-500">Value</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.attributes.map((attr: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/10">
                                <td className="py-2 px-2 text-gray-400 text-xs font-medium">
                                  {attr.attribute.name}
                                </td>
                                <td className="py-2 px-2 text-gray-300 text-xs">
                                  {attr.attribute_value.display_value || attr.attribute_value.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">
                          Bu ürün için özellik bilgisi bulunmamaktadır.
                        </p>
                      </div>
                    )}
                    <div className="text-center py-2 border-t border-white/10">
                      <p className="text-gray-500 text-xs">
                        Ürün kodu: <span className="font-mono text-white">{product.sku}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {product.translations?.short_description && (
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  {product.translations.short_description}
                </p>
              )}

              {product.translations?.long_description && (
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 mb-4">
                  <h3 className="text-base font-bold text-white mb-3">Detaylı Açıklama</h3>
                  <div
                    className="text-sm text-gray-300 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: product.translations.long_description
                    }}
                  />
                </div>
              )}
            </div>

            {product.product_features && product.product_features.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                  Öne Çıkan Özellikler
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {product.product_features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">{feature.feature_text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {((product.product_applications && product.product_applications.length > 0) ||
          (product.product_specifications && product.product_specifications.length > 0) ||
          (product.product_certifications && product.product_certifications.length > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {product.product_applications && product.product_applications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-400" />
                    Kullanım Alanları
                  </h2>
                  <div className="space-y-2">
                    {product.product_applications.map((app, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-sm text-gray-300">{app.application_text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {product.product_specifications && product.product_specifications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Ruler className="w-5 h-5 mr-2 text-blue-400" />
                    Teknik Özellikler
                  </h2>
                  <div className="space-y-2">
                    {product.product_specifications.map((spec, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">{spec.spec_key}</span>
                          <span className="text-white font-medium text-sm">
                            {spec.spec_value} {spec.spec_unit || ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {product.product_certifications && product.product_certifications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-400" />
                    Sertifikalar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.product_certifications.map((cert, index) => (
                      <span key={index} className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                        {cert.certification_code} - {cert.certification_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {((product.documents && product.documents.length > 0) || product.export_info) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {product.documents && product.documents.length > 0 && (
              <div className="lg:col-span-2">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-red-400" />
                    Dökümanlar ve Belgeler
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-red-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                              <FileText className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-sm">{doc.name}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <span className="text-xs">{doc.file_type.toUpperCase()}</span>
                                <span>•</span>
                                <span className="text-xs">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                          </div>
                          <button className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-300 hover:scale-110">
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {product.export_info && (
              <div className={product.documents && product.documents.length > 0 ? '' : 'lg:col-span-3'}>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-400" />
                    İhracat Bilgileri
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-base font-bold text-white mb-3 flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-blue-400" />
                        İhracat Ülkeleri
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {product.export_info.export_countries.map((country, index) => (
                          <div key={index} className="bg-white/5 rounded p-2 text-center border border-white/10">
                            <span className="text-xs text-gray-300">{country}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-base font-bold text-white mb-3 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-yellow-400" />
                        Standartlar
                      </h3>
                      <div className="space-y-2">
                        {product.export_info.standards.map((standard, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-gray-300">{standard}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-base font-bold text-white mb-3 flex items-center">
                        <Truck className="w-4 h-4 mr-2 text-green-400" />
                        Teslimat Bilgileri
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Paketleme</span>
                          <span className="text-white text-xs">{product.export_info.packaging_info}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Teslimat Süresi</span>
                          <span className="text-white text-xs">{product.export_info.delivery_time}</span>
                        </div>
                        {product.export_info.incoterms && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Incoterms</span>
                            <span className="text-white text-xs">{product.export_info.incoterms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isImageModalOpen && currentImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-xl p-2 rounded-full text-white hover:scale-110 transition-transform duration-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentImage.media?.url}
              alt={currentImage.alt_text || product.translations?.name || ''}
              className="w-full h-auto rounded-2xl"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
