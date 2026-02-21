import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Folder, Settings, TrendingUp, ArrowLeft } from 'lucide-react';
import { supabase, ProductAttribute } from '../../lib/supabase';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';
import { saveAndTranslate } from '../../services/unifiedTranslationService';
import toast from 'react-hot-toast';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const [activeTab, setActiveTab] = useState<'basic' | 'attributes' | 'seo'>('basic');

  const [formData, setFormData] = useState({
    slug: '',
    parent_id: '',
    sort_order: 0,
    is_active: true,
    image_id: '',
    image_url: '',
    description: '',
    banner_image_id: '',
    banner_image_url: '',
    seo_title: '',
    seo_description: '',
    featured_products: [] as string[],
    meta_title: '',
    meta_description: '',
    translations: {
      name: '',
      description: ''
    },
    category_attributes: [] as string[]
  });

  useEffect(() => {
    loadCategories();
    loadAttributes();
    if (isEdit && id) {
      loadCategory(id);
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      const categoriesWithTranslations = await Promise.all(
        (data || []).map(async (category) => {
          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .eq('translation_key', `category.${category.slug}.name`)
            .maybeSingle();

          return {
            ...category,
            displayName: translations?.translation_value || category.slug
          };
        })
      );

      setCategories(categoriesWithTranslations);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yuklenirken hata olustu');
    }
  };

  const loadAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setAttributes(data || []);
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

  const loadCategory = async (categoryId: string) => {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(attribute_id)
        `)
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;

      const { data: translations } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', currentLanguage)
        .in('translation_key', [
          `category.${categoryData.slug}.name`,
          `category.${categoryData.slug}.description`
        ]);

      const translationMap: any = {};
      translations?.forEach(t => {
        const key = t.translation_key.split('.').pop();
        translationMap[key] = t.translation_value;
      });

      setFormData({
        slug: categoryData.slug,
        parent_id: categoryData.parent_id || '',
        sort_order: categoryData.sort_order,
        is_active: categoryData.is_active,
        image_id: categoryData.image_id || '',
        image_url: '',
        description: categoryData.description || '',
        banner_image_id: categoryData.banner_image_id || '',
        banner_image_url: '',
        seo_title: categoryData.seo_title || '',
        seo_description: categoryData.seo_description || '',
        featured_products: categoryData.featured_products || [],
        meta_title: categoryData.meta_title || '',
        meta_description: categoryData.meta_description || '',
        translations: {
          name: translationMap.name || '',
          description: translationMap.description || ''
        },
        category_attributes: categoryData.attributes?.map((attr: any) => attr.attribute_id) || []
      });
    } catch (error) {
      console.error('Error loading category:', error);
      toast.error('Kategori yuklenirken hata olustu');
      navigate('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        slug: formData.slug,
        parent_id: formData.parent_id || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        image_id: formData.image_id || null,
        description: formData.description,
        banner_image_id: formData.banner_image_id || null,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        featured_products: formData.featured_products,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description
      };

      let categoryId = id;

      if (isEdit && id) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
          .single();

        if (error) throw error;
        categoryId = data.id;
      }

      if (formData.translations.name) {
        await saveAndTranslate(
          formData.translations.name,
          `category.${formData.slug}.name`,
          'category',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (formData.translations.description) {
        await saveAndTranslate(
          formData.translations.description,
          `category.${formData.slug}.description`,
          'category',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (categoryId) {
        await supabase
          .from('category_attributes')
          .delete()
          .eq('category_id', categoryId);

        if (formData.category_attributes.length > 0) {
          const categoryAttributes = formData.category_attributes.map((attributeId, index) => ({
            category_id: categoryId,
            attribute_id: attributeId,
            sort_order: index
          }));

          await supabase
            .from('category_attributes')
            .insert(categoryAttributes);
        }
      }

      toast.success(isEdit ? 'Kategori guncellendi' : 'Yeni kategori eklendi');
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Kaydetme sirasinda hata olustu');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/categories')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Kategori Duzenle' : 'Yeni Kategori Ekle'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Kategori bilgilerini guncelleyin' : 'Yeni bir kategori olusturun'}
            </p>
          </div>
        </div>
        <select
          value={currentLanguage}
          onChange={(e) => setCurrentLanguage(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tr">Turkce</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'basic', name: 'Temel Bilgiler', icon: Folder },
              { id: 'attributes', name: 'Ozellikler', icon: Settings },
              { id: 'seo', name: 'SEO', icon: TrendingUp }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adi ({currentLanguage.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    value={formData.translations.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        slug: generateSlug(name),
                        translations: {
                          ...formData.translations,
                          name
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ust Kategori
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ana Kategori</option>
                    {categories.filter(cat => cat.id !== id && !cat.parent_id).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Siralama
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadSelector
                  value={formData.image_id}
                  onChange={(mediaId, url) => setFormData({ ...formData, image_id: mediaId, image_url: url })}
                  label="Kategori Gorseli"
                  folder="categories"
                />

                <ImageUploadSelector
                  value={formData.banner_image_id}
                  onChange={(mediaId, url) => setFormData({ ...formData, banner_image_id: mediaId, banner_image_url: url })}
                  label="Banner Gorseli"
                  folder="categories/banners"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aciklama ({currentLanguage.toUpperCase()})
                </label>
                <textarea
                  value={formData.translations.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      description: e.target.value
                    }
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Ozellikleri
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Bu kategorideki urunler icin hangi ozelliklerin gorunecegini secin. Secilen ozellikler urun eklerken otomatik olarak yuklenecektir.
                </p>

                {attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {attributes.map((attribute: any) => (
                      <label key={attribute.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.category_attributes.includes(attribute.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                category_attributes: [...formData.category_attributes, attribute.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                category_attributes: formData.category_attributes.filter(attrId => attrId !== attribute.id)
                              });
                            }
                          }}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">{attribute.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {attribute.scope === 'product' && 'Urun'}
                            {attribute.scope === 'variant' && 'Varyant'}
                            {attribute.scope === 'both' && 'Urun + Varyant'}
                            {!attribute.scope && attribute.type}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Henuz urun ozelligi tanimlanmamis</p>
                    <p className="text-sm text-gray-400 mt-1">Once Admin - Ozellik Yonetimi'nden ozellik ekleyin</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Baslik
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seo_title.length}/60 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Baslik
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60 karakter</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Aciklama
                </label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.seo_description.length}/160 karakter</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Aciklama
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160 karakter</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Iptal</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
