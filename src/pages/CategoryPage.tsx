import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Grid2x2 as Grid, List, Heart, X, ChevronDown, ChevronRight, Home } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { unifiedAttributeFilterService, AttributeFilter } from '../services/unifiedAttributeFilterService';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [expandedFilters, setExpandedFilters] = useState<string[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroups, setFilterGroups] = useState<AttributeFilter[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (categorySlug) {
      loadCategoryAndProducts();
      loadSubCategories();
      loadBreadcrumbs();
    }
  }, [categorySlug, currentLanguage]);

  useEffect(() => {
    if (products.length > 0) {
      loadFilters();
    }
  }, [products]);

  useEffect(() => {
    if (filterGroups.length > 0) {
      setExpandedFilters(filterGroups.slice(0, 3).map(g => g.slug));
    }
  }, [filterGroups]);

  useEffect(() => {
    filterProducts();
  }, [products, selectedFilters, searchTerm]);

  const loadCategoryAndProducts = async () => {
    try {
      const { data: categoryData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .maybeSingle();

      if (catError) throw catError;

      if (!categoryData) {
        setLoading(false);
        return;
      }

      // Türkçe çevirileri al
      const { data: trTranslations } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', 'tr')
        .in('translation_key', [
          `category.${categoryData.slug}.name`,
          `category.${categoryData.slug}.description`
        ]);

      const trMap: any = {};
      trTranslations?.forEach(t => {
        const key = t.translation_key.split('.').pop();
        trMap[key] = t.translation_value || t.source_text;
      });

      const turkishName = trMap.name || categoryData.slug;
      const turkishDesc = trMap.description || categoryData.description || '';

      // Seçili dile çevir
      const translatedName = await translate(
        turkishName,
        currentLanguage,
        `category.${categoryData.slug}.name`,
        { type: 'category' }
      );

      const translatedDesc = await translate(
        turkishDesc,
        currentLanguage,
        `category.${categoryData.slug}.description`,
        { type: 'category' }
      );

      setCategory({
        ...categoryData,
        name: translatedName,
        description: translatedDesc
      });

      // Junction table üzerinden kategorideki tüm ürünleri getir
      const { data: productCategories, error: pcError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryData.id);

      if (pcError) throw pcError;

      const productIds = productCategories?.map(pc => pc.product_id) || [];

      if (productIds.length === 0) {
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('status', 'active')
        .order('sort_order');

      if (productsError) throw productsError;

      const productsWithDetails = await Promise.all(
        (productsData || []).map(async (product) => {
          // Türkçe ürün bilgisini al
          const { data: trTranslation } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', 'tr')
            .in('translation_key', [
              `product.${product.id}.name`,
              `product.${product.id}.short_desc`
            ]);

          const trProdMap: any = {};
          trTranslation?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            trProdMap[key] = t.translation_value || t.source_text;
          });

          const turkishProductName = trProdMap.name || product.sku;
          const turkishProductDesc = trProdMap.short_desc || '';

          // Seçili dile çevir
          const translatedProductName = await translate(
            turkishProductName,
            currentLanguage,
            `product.${product.id}.name`,
            { type: 'product' }
          );

          const translatedProductDesc = await translate(
            turkishProductDesc,
            currentLanguage,
            `product.${product.id}.short_desc`,
            { type: 'product' }
          );

          const { data: primaryImage } = await supabase
            .from('product_images')
            .select('*, media(url)')
            .eq('product_id', product.id)
            .eq('is_primary', true)
            .maybeSingle();

          let imageUrl = primaryImage?.media?.url;
          if (!imageUrl) {
            const { data: firstImage } = await supabase
              .from('product_images')
              .select('*, media(url)')
              .eq('product_id', product.id)
              .order('sort_order')
              .limit(1)
              .maybeSingle();

            imageUrl = firstImage?.media?.url;
          }

          const { data: attributeAssignments } = await supabase
            .from('product_attribute_assignments')
            .select('attribute_value_id')
            .eq('product_id', product.id);

          return {
            ...product,
            name: translatedProductName,
            description: translatedProductDesc,
            slug: product.slug || product.sku.toLowerCase().replace(/\s+/g, '-'),
            image: imageUrl || `https://www.kartmix.com/tema/genel/uploads/urunler/resim-yok.png`,
            attributeValueIds: (attributeAssignments || []).map(aa => aa.attribute_value_id)
          };
        })
      );

      setProducts(productsWithDetails);
    } catch (error) {
      console.error('Error loading category and products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      if (products.length === 0) {
        setFilterGroups([]);
        return;
      }

      const productIds = products.map(p => p.id);
      const relevantFilters = await unifiedAttributeFilterService.getRelevantFiltersForProducts(
        productIds,
        currentLanguage
      );

      setFilterGroups(relevantFilters);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadSubCategories = async () => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (!catData) return;

      const subCats = await unifiedAttributeFilterService.getSubCategories(catData.id, currentLanguage);
      setSubCategories(subCats);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadBreadcrumbs = async () => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (!catData) return;

      const crumbs = [];
      let currentCategoryId = catData.id;

      while (currentCategoryId) {
        const { data: cat, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', currentCategoryId)
          .single();

        if (error || !cat) break;

        const { data: translations } = await supabase
          .from('translations')
          .select('*')
          .eq('language_code', 'tr')
          .eq('translation_key', `category.${cat.slug}.name`)
          .maybeSingle();

        crumbs.unshift({
          id: cat.id,
          name: translations?.translation_value || cat.slug,
          slug: cat.slug
        });

        currentCategoryId = cat.parent_id;
      }

      setBreadcrumbs(crumbs);
    } catch (error) {
      console.error('Error loading breadcrumbs:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        (product.name || product.sku).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilters.length > 0) {
      filtered = filtered.filter(product =>
        selectedFilters.every(filterId =>
          product.attributeValueIds && product.attributeValueIds.includes(filterId)
        )
      );
    }

    setFilteredProducts(filtered);
  };

  const toggleFilter = (groupSlug: string) => {
    setExpandedFilters(prev =>
      prev.includes(groupSlug)
        ? prev.filter(f => f !== groupSlug)
        : [...prev, groupSlug]
    );
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Filter;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-300">Kategori ve Ürünler Yükleniyor...</h2>
          <p className="text-sm text-gray-500 mt-2">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Kategori Bulunamadı</h1>
          <p className="text-gray-400 mb-6">Aradığınız kategori bulunamadı veya silinmiş olabilir.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center space-x-2 text-sm mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>{t('header.home', 'Ana Sayfa')}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button
              onClick={() => navigate('/urunler')}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              {t('header.products', 'Ürünler')}
            </button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <button
                  onClick={() => index < breadcrumbs.length - 1 ? navigate(`/kategori/${crumb.slug}`) : null}
                  className={index < breadcrumbs.length - 1 ? "text-gray-400 hover:text-white transition-colors duration-300" : "text-white font-medium"}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (breadcrumbs.length > 1) {
                    navigate(`/kategori/${breadcrumbs[breadcrumbs.length - 2].slug}`);
                  } else {
                    navigate('/urunler');
                  }
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{category.name}</h1>
                <p className="text-sm text-gray-400">{category.description}</p>
              </div>
            </div>
            {products.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                >
                  {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {(products.length > 0 || subCategories.length > 0) && (
            <>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-24 right-6 z-50 bg-white text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-white"
              >
                <Filter className="w-5 h-5" />
              </button>

              {isSidebarOpen && (
                <div
                  className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              <div className={`
                w-72 flex-shrink-0
                lg:block
                fixed lg:sticky
                top-0 lg:top-32
                left-0
                h-screen lg:h-auto
                lg:max-h-[calc(100vh-8rem)]
                z-50 lg:z-auto
                transition-transform duration-300 ease-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div className="bg-gray-900/95 lg:bg-gray-900/50 backdrop-blur-xl rounded-none lg:rounded-2xl border-r lg:border border-white/10 p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 lg:hidden">
                    <h3 className="text-lg font-semibold text-white">Filtreler</h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                {products.length > 0 && (
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                      />
                    </div>
                  </div>
                )}

                {subCategories.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-base font-semibold mb-3 flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Alt Kategoriler
                    </h3>
                    <div className="space-y-1">
                      {subCategories.map((subCat) => (
                        <button
                          key={subCat.id}
                          onClick={() => navigate(`/kategori/${subCat.slug}`)}
                          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 text-xs border border-white/10 hover:border-white/20 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="group-hover:text-white transition-colors duration-300">{subCat.name}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors duration-300" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {products.length > 0 && filterGroups.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold mb-3 flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Filtreler
                    </h3>
                    {selectedFilters.length > 0 && (
                      <button
                        onClick={() => setSelectedFilters([])}
                        className="w-full text-xs text-gray-400 hover:text-white mb-2 flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Filtreleri Temizle</span>
                      </button>
                    )}
                    {filterGroups.map((group) => {
                      const GroupIcon = getIconComponent(group.icon);
                      return (
                        <div key={group.id} className="border-b border-white/10 pb-3">
                          <button
                            onClick={() => toggleFilter(group.slug)}
                            className="w-full flex items-center justify-between text-left font-medium mb-2 hover:text-gray-300 transition-colors duration-300 text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <GroupIcon className="w-4 h-4" />
                              <span>{group.name}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                              expandedFilters.includes(group.slug) ? 'rotate-180' : ''
                            }`} />
                          </button>
                          {expandedFilters.includes(group.slug) && (
                            <div className="space-y-1 animate-in slide-in-from-top duration-300">
                              {group.values.map((value) => (
                                <label key={value.id} className="flex items-center space-x-2 cursor-pointer group py-1">
                                  <input
                                    type="checkbox"
                                    className="rounded border-white/20 bg-white/10 text-white focus:ring-white/50 w-3 h-3"
                                    checked={selectedFilters.includes(value.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedFilters([...selectedFilters, value.id]);
                                      } else {
                                        setSelectedFilters(selectedFilters.filter(f => f !== value.id));
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors duration-300">
                                    {value.display_value || value.value}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </>
          )}

          <div className="flex-1">
            {subCategories.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-6">Alt Kategoriler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subCategories.map((subCat) => (
                    <div
                      key={subCat.id}
                      onClick={() => navigate(`/kategori/${subCat.slug}`)}
                      className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
                    >
                      {subCat.imageUrl && (
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={subCat.imageUrl}
                            alt={subCat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white group-hover:text-gray-100 transition-colors duration-300">
                            {subCat.name}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        {subCat.description && (
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 line-clamp-2">
                            {subCat.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {products.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Ürünler {filteredProducts.length !== products.length && `(${filteredProducts.length}/${products.length})`}
                  </h2>
                  {selectedFilters.length > 0 && (
                    <span className="text-sm text-gray-400">
                      {selectedFilters.length} filtre aktif
                    </span>
                  )}
                </div>
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/urun/${product.slug || product.sku}`)}
                      className={`group bg-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'}`}>
                        <img
                          src={product.image}
                          alt={product.name || product.sku}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                          <Heart className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <div className="p-6 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gray-100 transition-colors duration-300">
                          {product.name || product.sku}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex justify-end">
                          <div className="text-white text-sm font-medium group-hover:text-gray-300 transition-colors duration-300 flex items-center space-x-2">
                            <span>Detayları Görüntüle</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Seçtiğiniz filtrelere uygun ürün bulunamadı.</p>
                    <button
                      onClick={() => setSelectedFilters([])}
                      className="mt-4 text-white hover:text-gray-300"
                    >
                      Filtreleri temizle
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">{t('ui.product.no_products', 'Bu kategoride henüz ürün bulunmamaktadır.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CategoryPage;
