import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, Package, Eye, EyeOff, Copy, Star, Grid2x2 as Grid, List, Upload, CheckSquare, Square, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase, Product, Category } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ExtendedProduct extends Product {
  category?: Category;
  variants_count?: number;
  images_count?: number;
  reviews_count?: number;
  average_rating?: number;
  translations?: {
    name: string;
    description: string;
    short_description: string;
  };
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [selectedStatus, currentLanguage]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, slug),
          variants:product_variants(id),
          images:product_images(id, is_primary, media(url)),
          reviews:product_reviews(id, rating)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      const productsWithTranslations = await Promise.all(
        (data || []).map(async (product) => {
          // Ürün çevirilerini unified translations tablosundan al
          const { data: translations } = await supabase
            .from('translations')
            .select('translation_key, translation_value')
            .eq('language_code', currentLanguage)
            .in('translation_key', [
              `product.${product.id}.name`,
              `product.${product.id}.short_desc`,
              `product.${product.id}.long_desc`
            ]);

          const translationMap: any = {
            name: product.sku, // Fallback to SKU if no translation
            description: '',
            short_description: ''
          };

          translations?.forEach(t => {
            if (t.translation_key.endsWith('.name')) {
              translationMap.name = t.translation_value;
            } else if (t.translation_key.endsWith('.short_desc')) {
              translationMap.short_description = t.translation_value;
            } else if (t.translation_key.endsWith('.long_desc')) {
              translationMap.description = t.translation_value;
            }
          });

          const { data: productCategories } = await supabase
            .from('product_categories')
            .select('category_id, is_primary, categories(id, slug)')
            .eq('product_id', product.id)
            .eq('is_primary', true)
            .maybeSingle();

          let primaryCategory = null;
          if (productCategories) {
            const { data: catTranslations } = await supabase
              .from('translations')
              .select('*')
              .eq('language_code', currentLanguage)
              .eq('translation_key', `category.${productCategories.categories.slug}.name`)
              .maybeSingle();

            primaryCategory = {
              ...productCategories.categories,
              translations: {
                name: catTranslations?.translation_value || productCategories.categories.slug
              }
            };
          }

          const primaryImage = product.images?.find((img: any) => img.is_primary)?.media?.url;

          const variants_count = product.variants?.length || 0;
          const images_count = product.images?.length || 0;
          const reviews_count = product.reviews?.length || 0;
          const average_rating = reviews_count > 0
            ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews_count
            : 0;

          return {
            ...product,
            translations: translationMap,
            category: primaryCategory,
            primary_image: primaryImage,
            variants_count,
            images_count,
            reviews_count,
            average_rating
          };
        })
      );

      setProducts(productsWithTranslations);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedCategory) {
      const hasCategory = product.category?.id === selectedCategory;
      if (!hasCategory) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLocaleLowerCase('tr');
      const matchesSku = product.sku?.toLocaleLowerCase('tr').includes(search);
      const matchesBrand = product.brand?.toLocaleLowerCase('tr').includes(search);
      const matchesModel = product.model?.toLocaleLowerCase('tr').includes(search);
      const matchesName = product.translations?.name?.toLocaleLowerCase('tr').includes(search);
      const matchesDescription = product.translations?.short_description?.toLocaleLowerCase('tr').includes(search);

      if (!matchesSku && !matchesBrand && !matchesModel && !matchesName && !matchesDescription) {
        return false;
      }
    }

    return true;
  });

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const categoriesWithTranslations = await Promise.all(
        (data || []).map(async (category) => {
          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .eq('translation_key', `category.${category.slug}.name`);

          return {
            ...category,
            translations: {
              name: translations?.[0]?.translation_value || category.slug
            }
          };
        })
      );

      setCategories(categoriesWithTranslations);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Ürün silindi');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadProducts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !featured })
        .eq('id', id);

      if (error) throw error;
      toast.success('Öne çıkan durum güncellendi');
      loadProducts();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleMoveUp = async (product: ExtendedProduct, index: number) => {
    if (index === 0) return;

    const previousProduct = filteredProducts[index - 1];
    const currentSortOrder = product.sort_order || 0;
    const previousSortOrder = previousProduct.sort_order || 0;

    try {
      await supabase
        .from('products')
        .update({ sort_order: previousSortOrder })
        .eq('id', product.id);

      await supabase
        .from('products')
        .update({ sort_order: currentSortOrder })
        .eq('id', previousProduct.id);

      toast.success('Sıra güncellendi');
      loadProducts();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Sıra güncellenirken hata oluştu');
    }
  };

  const handleMoveDown = async (product: ExtendedProduct, index: number) => {
    if (index === filteredProducts.length - 1) return;

    const nextProduct = filteredProducts[index + 1];
    const currentSortOrder = product.sort_order || 0;
    const nextSortOrder = nextProduct.sort_order || 0;

    try {
      await supabase
        .from('products')
        .update({ sort_order: nextSortOrder })
        .eq('id', product.id);

      await supabase
        .from('products')
        .update({ sort_order: currentSortOrder })
        .eq('id', nextProduct.id);

      toast.success('Sıra güncellendi');
      loadProducts();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Sıra güncellenirken hata oluştu');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    if (!confirm(`${selectedProducts.length} ürün silinecek. Emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;
      toast.success(`${selectedProducts.length} ürün silindi`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast.error('Toplu silme sırasında hata oluştu');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .in('id', selectedProducts);

      if (error) throw error;
      toast.success(`${selectedProducts.length} ürünün durumu güncellendi`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('Toplu durum güncelleme sırasında hata oluştu');
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    if (!categoryId) {
      toast.error('Lütfen bir kategori seçin');
      return;
    }

    try {
      for (const productId of selectedProducts) {
        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', productId);

        await supabase
          .from('product_categories')
          .insert({
            product_id: productId,
            category_id: categoryId,
            is_primary: true
          });
      }

      toast.success(`${selectedProducts.length} ürünün kategorisi güncellendi`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error bulk updating category:', error);
      toast.error('Toplu kategori güncelleme sırasında hata oluştu');
    }
  };

  const handleBulkBrandUpdate = async (brand: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    if (!brand.trim()) {
      toast.error('Lütfen bir marka adı girin');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ brand: brand.trim() })
        .in('id', selectedProducts);

      if (error) throw error;
      toast.success(`${selectedProducts.length} ürünün markası güncellendi`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error bulk updating brand:', error);
      toast.error('Toplu marka güncelleme sırasında hata oluştu');
    }
  };

  const handleCloneProduct = async (product: ExtendedProduct) => {
    try {
      const timestamp = Date.now().toString().slice(-6);
      const clonedProduct = {
        sku: `${product.sku}-COPY-${timestamp}`,
        category_id: product.category_id,
        parent_id: product.parent_id,
        product_type: product.product_type,
        status: 'draft',
        featured: false,
        sort_order: product.sort_order,
        specifications: product.specifications,
        features: product.features,
        applications: product.applications,
        dimensions: product.dimensions,
        weight: product.weight,
        shrink_volume: product.shrink_volume,
        shrink_measurement: product.shrink_measurement,
        quantity_per_box: product.quantity_per_box,
        quantity_per_shrink: product.quantity_per_shrink,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        brand: product.brand,
        model: product.model,
        warranty_period: product.warranty_period,
        min_order_quantity: product.min_order_quantity,
        lead_time_days: product.lead_time_days,
        is_customizable: product.is_customizable,
        energy_class: product.energy_class,
        certifications: product.certifications,
        technical_specs: product.technical_specs,
        installation_notes: product.installation_notes,
        maintenance_notes: product.maintenance_notes,
        slug: product.slug ? `${product.slug}-copy-${timestamp}` : null
      };

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([clonedProduct])
        .select()
        .single();

      if (error) throw error;

      if (newProduct) {
        const newExtendedProduct: ExtendedProduct = {
          ...newProduct,
          category: product.category,
          variants_count: 0,
          images_count: 0,
          reviews_count: 0,
          average_rating: 0,
          translations: product.translations
        };

        setProducts(prev => [newExtendedProduct, ...prev]);
      }

      toast.success('Ürün kopyalandı');
    } catch (error) {
      console.error('Error cloning product:', error);
      toast.error('Kopyalama sırasında hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'draft': return 'Taslak';
      case 'archived': return 'Arşiv';
      default: return status;
    }
  };

  const getProductTypeText = (type: string) => {
    switch (type) {
      case 'simple': return 'Basit Ürün';
      case 'variant': return 'Varyantlı Ürün';
      case 'grouped': return 'Gruplu Ürün';
      default: return type;
    }
  };

  const getEnergyClassColor = (energyClass: string) => {
    switch (energyClass) {
      case 'A++': return 'bg-green-500';
      case 'A+': return 'bg-green-400';
      case 'A': return 'bg-yellow-400';
      case 'B': return 'bg-orange-400';
      case 'C': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
          <p className="text-gray-600 mt-1">Ürün kataloğunu ve özelliklerini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
          <button
            onClick={() => navigate('/admin/products/bulk-import')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Toplu İmport</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Ürün</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredProducts.filter(p => p.status === 'active').length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Öne Çıkan</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredProducts.filter(p => p.featured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Varyantlı</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredProducts.filter(p => p.product_type === 'variant').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taslak</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredProducts.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <Edit className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedProducts.length} ürün seçildi
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value === 'active' || e.target.value === 'inactive' || e.target.value === 'draft') {
                    handleBulkStatusChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="">Durum Değiştir</option>
                <option value="active">Aktif Yap</option>
                <option value="inactive">Pasif Yap</option>
                <option value="draft">Taslak Yap</option>
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkCategoryChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="">Kategori Değiştir</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.translations?.name || cat.slug}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const brand = prompt('Marka adı girin:');
                  if (brand) handleBulkBrandUpdate(brand);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Marka Güncelle
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.translations?.name || cat.slug}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşiv</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SKU, marka veya model ara..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {product.sku}
                      </span>
                      {product.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.translations?.name || product.sku}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{product.category?.translations?.name || 'Kategori yok'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCloneProduct(product)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.variants_count} varyant
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center space-x-2 hover:text-gray-700"
                    >
                      {selectedProducts.length === filteredProducts.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marka/Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İstatistikler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelectProduct(product.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {selectedProducts.includes(product.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 w-8 text-center">
                          {product.sort_order}
                        </span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleMoveUp(product, index)}
                            disabled={index === 0}
                            className={`${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                            title="Yukarı taşı"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(product, index)}
                            disabled={index === filteredProducts.length - 1}
                            className={`${index === filteredProducts.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                            title="Aşağı taşı"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center mr-3 overflow-hidden">
                          {(product as any).primary_image ? (
                            <img
                              src={(product as any).primary_image}
                              alt={product.translations?.name || product.sku}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {product.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
                            )}
                            {product.translations?.name || product.sku}
                          </div>
                          {product.translations?.name && (
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {product.category?.translations?.name || 'Kategori yok'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getProductTypeText(product.product_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.brand && <div><strong>Marka:</strong> {product.brand}</div>}
                        {product.model && <div><strong>Model:</strong> {product.model}</div>}
                        {!product.brand && !product.model && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>{product.variants_count} varyant</div>
                        <div>{product.images_count} görsel</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}
                        >
                          {product.status === 'active' ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                          {getStatusText(product.status)}
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(product.id, product.featured)}
                          className={`p-1 rounded ${product.featured ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                          title={product.featured ? 'Öne çıkandan kaldır' : 'Öne çıkar'}
                        >
                          <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCloneProduct(product)}
                          className="text-green-600 hover:text-green-800"
                          title="Kopyala"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
