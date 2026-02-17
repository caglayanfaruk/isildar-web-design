import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Ruler,
  Weight,
  Box,
  DollarSign,
  Warehouse,
  CheckCircle,
  XCircle,
  Camera,
  Tag,
  X,
  FileText,
  Download,
  Award,
  Globe,
  Truck,
  Building
} from 'lucide-react';
import { getVariantDetails, VariantDetail } from '../services/variantService';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const VariantDetailPage = () => {
  const { variantCode } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useTranslation();
  const [variant, setVariant] = useState<VariantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (variantCode) {
      loadVariant();
    }
  }, [variantCode, currentLanguage]);

  const loadVariant = async () => {
    if (!variantCode) return;

    setLoading(true);
    try {
      const data = await getVariantDetails(variantCode, currentLanguage);
      if (data) {
        setVariant(data);
      } else {
        toast.error('Varyant bulunamadı');
        navigate('/urunler');
      }
    } catch (error) {
      console.error('Error loading variant:', error);
      toast.error('Varyant yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (!variant?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % variant.images.length);
  };

  const prevImage = () => {
    if (!variant?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + variant.images.length) % variant.images.length);
  };

  const getStockStatus = () => {
    if (!variant?.inventory) return null;
    if (!variant.inventory.track_inventory) return null;

    const availableStock = variant.inventory.quantity - variant.inventory.reserved_quantity;
    if (availableStock <= 0) return { color: 'text-red-400', bg: 'bg-red-500/20', text: 'Stokta Yok', icon: XCircle };
    if (availableStock <= variant.inventory.low_stock_threshold) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'Düşük Stok', icon: CheckCircle };
    return { color: 'text-green-400', bg: 'bg-green-500/20', text: 'Stokta Var', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-44 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="min-h-screen bg-black text-white pt-44 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Varyant Bulunamadı</h1>
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

  const images = variant.images || [];
  const currentImage = images[currentImageIndex];
  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus?.icon;

  return (
    <div className="min-h-screen bg-black text-white pt-44">
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Ana Sayfa</button>
            <span>/</span>
            <button onClick={() => navigate('/urunler')} className="hover:text-white transition-colors">Ürünler</button>
            <span>/</span>
            {variant.product && (
              <>
                <button
                  onClick={() => navigate(`/urun/${variant.product_id}`)}
                  className="hover:text-white transition-colors"
                >
                  {variant.product.translations?.name || variant.product.sku}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-white">{variant.sku}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            {images.length > 0 ? (
              <>
                <div className="relative bg-white rounded-2xl overflow-hidden border border-white/10 group aspect-square">
                  <img
                    src={currentImage?.media?.url || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'}
                    alt={currentImage?.alt_text || variant.sku}
                    className="w-full h-full object-contain cursor-pointer p-4"
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
                          alt={image.alt_text || `${variant.sku} ${index + 1}`}
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
                  Varyant
                </span>
                {variant.is_default && (
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                    Varsayılan
                  </span>
                )}
                {stockStatus && StatusIcon && (
                  <span className={`${stockStatus.bg} ${stockStatus.color} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{stockStatus.text}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                {variant.variant_name || variant.custom_fields?.adi || variant.sku}
              </h1>

              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Varyant Kodu</span>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-mono text-sm font-bold">
                    {variant.sku}
                  </span>
                </div>
                {variant.barcode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Barkod</span>
                    <span className="text-white font-mono text-sm">{variant.barcode}</span>
                  </div>
                )}
              </div>

              {variant.attributes && variant.attributes.length > 0 && (
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Varyant Özellikleri
                  </h3>
                  <div className="space-y-3">
                    {variant.attributes.map((attr: any) => (
                      <div key={attr.attribute.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">{attr.attribute.name}</span>
                        <div className="flex items-center space-x-2">
                          {attr.attribute_value.color_code && (
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white/30"
                              style={{ backgroundColor: attr.attribute_value.color_code }}
                            />
                          )}
                          <span className="text-white font-medium text-sm">
                            {attr.attribute_value.display_value || attr.attribute_value.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {variant.price && (
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Fiyat</p>
                    <p className="text-3xl font-bold text-white">₺{variant.price.toFixed(2)}</p>
                    {variant.compare_price && variant.compare_price > variant.price && (
                      <p className="text-sm text-gray-400 line-through mt-1">₺{variant.compare_price.toFixed(2)}</p>
                    )}
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-400 opacity-50" />
                </div>

                {variant.price_tiers && variant.price_tiers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Toplu Alım İndirimleri</p>
                    <div className="space-y-1">
                      {variant.price_tiers.map((tier) => (
                        <div key={tier.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {tier.min_quantity}{tier.max_quantity ? `-${tier.max_quantity}` : '+'} adet
                          </span>
                          <span className="text-white font-medium">₺{tier.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {variant.dimensions && (
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Ruler className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Boyutlar</span>
                  </div>
                  <p className="text-white font-medium">{variant.dimensions}</p>
                </div>
              )}

              {variant.weight && (
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Weight className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Ağırlık</span>
                  </div>
                  <p className="text-white font-medium">{variant.weight} kg</p>
                </div>
              )}

              {variant.inventory && variant.inventory.track_inventory && (
                <>
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Warehouse className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">Mevcut Stok</span>
                    </div>
                    <p className="text-white font-medium">{variant.inventory.quantity} adet</p>
                  </div>

                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Box className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Kullanılabilir</span>
                    </div>
                    <p className="text-white font-medium">
                      {variant.inventory.quantity - variant.inventory.reserved_quantity} adet
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {variant.product_features && variant.product_features.length > 0 && (
          <div className="mb-8">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                Öne Çıkan Özellikler
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {variant.product_features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">{feature.feature_text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(variant.product?.translations?.short_description || variant.product?.translations?.long_description) && (
          <div className="mb-8">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              {variant.product?.translations?.short_description && (
                <>
                  <h3 className="text-lg font-bold text-white mb-3">Ürün Hakkında</h3>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {variant.product.translations.short_description}
                  </p>
                </>
              )}

              {variant.product?.translations?.long_description && (
                <>
                  <h3 className="text-base font-bold text-white mb-3 mt-4">Detaylı Açıklama</h3>
                  <div
                    className="text-sm text-gray-300 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: variant.product.translations.long_description
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {((variant.product_applications && variant.product_applications.length > 0) ||
          (variant.product_specifications && variant.product_specifications.length > 0) ||
          (variant.product_certifications && variant.product_certifications.length > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {variant.product_applications && variant.product_applications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-400" />
                    Kullanım Alanları
                  </h2>
                  <div className="space-y-2">
                    {variant.product_applications.map((app, index) => (
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

            {variant.product_specifications && variant.product_specifications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Ruler className="w-5 h-5 mr-2 text-blue-400" />
                    Teknik Özellikler
                  </h2>
                  <div className="space-y-2">
                    {variant.product_specifications.map((spec, index) => (
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

            {variant.product_certifications && variant.product_certifications.length > 0 && (
              <div>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-400" />
                    Sertifikalar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {variant.product_certifications.map((cert, index) => (
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

        {variant.other_variants && variant.other_variants.length > 0 && (
          <div className="mb-8">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Diğer Varyantlar
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Bu ürün grubunda {variant.other_variants.length + 1} farklı varyant bulunmaktadır.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20 bg-white/5">
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        KOD<br/><span className="text-gray-500">Code</span>
                      </th>
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        Adı<br/><span className="text-gray-500">Name</span>
                      </th>
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        Kutu Adet<br/><span className="text-gray-500">Box Pieces</span>
                      </th>
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        Koli Adet<br/><span className="text-gray-500">Package Pieces</span>
                      </th>
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        Koli Hacim <span className="text-gray-500">(m³)</span><br/><span className="text-gray-500">Pack Volume</span>
                      </th>
                      <th className="text-left py-3 px-3 text-gray-300 font-semibold text-xs">
                        Koli Ağırlık <span className="text-gray-500">(kg)</span><br/><span className="text-gray-500">Pack Weight</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10 bg-white/5">
                      <td className="py-3 px-3">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono text-xs font-bold">
                          {variant.sku}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white text-xs font-medium">
                        {variant.custom_fields?.adi || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-300 text-xs">
                        {variant.box_pieces || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-300 text-xs">
                        {variant.package_pieces || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-300 text-xs">
                        {variant.package_volume || '-'}
                      </td>
                      <td className="py-3 px-3 text-gray-300 text-xs">
                        {variant.package_weight || '-'}
                      </td>
                    </tr>
                    {variant.other_variants.map((otherVariant: any) => (
                      <tr
                        key={otherVariant.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors duration-300 cursor-pointer"
                        onClick={() => navigate(`/urun/variant/${otherVariant.sku}`)}
                      >
                        <td className="py-3 px-3">
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono text-xs font-bold hover:bg-blue-500/30 transition-colors duration-300">
                            {otherVariant.sku}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white text-xs font-medium">
                          {otherVariant.custom_fields?.adi || '-'}
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-xs">
                          {otherVariant.box_pieces || '-'}
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-xs">
                          {otherVariant.package_pieces || '-'}
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-xs">
                          {otherVariant.package_volume || '-'}
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-xs">
                          {otherVariant.package_weight || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  Detaylı bilgi için varyant koduna tıklayın
                </p>
              </div>
            </div>
          </div>
        )}

        {((variant.documents && variant.documents.length > 0) || variant.export_info) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {variant.documents && variant.documents.length > 0 && (
              <div className="lg:col-span-2">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-red-400" />
                    Dökümanlar ve Belgeler
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variant.documents.map((doc) => (
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
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {variant.export_info && (
              <div className={variant.documents && variant.documents.length > 0 ? '' : 'lg:col-span-3'}>
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-400" />
                    İhracat Bilgileri
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">HS Kodu</span>
                        <span className="text-white font-medium font-mono text-sm">{variant.export_info.hs_code}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Menşei Ülke</span>
                        <span className="text-white font-medium text-sm">{variant.export_info.country_of_origin}</span>
                      </div>
                    </div>
                    {variant.export_info.export_description && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <span className="text-gray-400 text-sm block mb-2">Açıklama</span>
                        <p className="text-white text-sm leading-relaxed">{variant.export_info.export_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {variant.product && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/urun/${variant.product_id}`)}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-300 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Ürüne Dön</span>
            </button>
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
              alt={currentImage.alt_text || variant.sku}
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

export default VariantDetailPage;
