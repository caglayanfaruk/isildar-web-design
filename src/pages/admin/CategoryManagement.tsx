import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, Eye, EyeOff, ArrowUp, ArrowDown, Folder, FolderOpen, Tag } from 'lucide-react';
import { supabase, Category, ProductAttribute } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ExtendedCategory extends Category {
  parent?: Category;
  children?: ExtendedCategory[];
  attributes?: ProductAttribute[];
  product_count?: number;
  translations?: {
    name: string;
    description: string;
  };
}

const CategoryManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('tr');

  useEffect(() => {
    loadCategories();
    loadAttributes();
  }, [currentLanguage]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id(id, slug),
          attributes:category_attributes(
            attribute:product_attributes(id, name, type)
          )
        `)
        .order('sort_order');

      if (error) throw error;

      const categoriesWithTranslations = await Promise.all(
        (data || []).map(async (category) => {
          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .in('translation_key', [
              `category.${category.slug}.name`,
              `category.${category.slug}.description`
            ]);

          const translationMap: any = {};
          translations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            translationMap[key] = t.translation_value;
          });

          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('category_id', category.id);

          return {
            ...category,
            translations: translationMap,
            product_count: count || 0
          };
        })
      );

      setCategories(categoriesWithTranslations);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Kategori silindi');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadCategories();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentCategory = categories.find(cat => cat.id === id);
      if (!currentCategory) return;

      const newOrder = direction === 'up' ? currentCategory.sort_order - 1 : currentCategory.sort_order + 1;

      const { error } = await supabase
        .from('categories')
        .update({ sort_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      toast.success('Sıralama güncellendi');
      loadCategories();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  };

  const buildCategoryTree = (categories: ExtendedCategory[], parentId: string | null = null): ExtendedCategory[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }));
  };

  const renderCategoryRow = (category: ExtendedCategory, level: number = 0) => {
    const indent = level * 20;

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
              {level > 0 && <span className="text-gray-400 mr-2">└</span>}
              <div className="flex items-center">
                {category.children && category.children.length > 0 ? (
                  <FolderOpen className="w-5 h-5 text-blue-500 mr-2" />
                ) : (
                  <Folder className="w-5 h-5 text-gray-400 mr-2" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {category.translations?.name || category.slug}
                  </div>
                  <div className="text-sm text-gray-500">/{category.slug}</div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">
              {category.parent?.slug || 'Ana Kategori'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {category.product_count} ürün
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">
              {category.attributes?.length || 0} özellik
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{category.sort_order}</span>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => handleReorder(category.id, 'up')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleReorder(category.id, 'down')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <button
              onClick={() => handleToggleActive(category.id, category.is_active)}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                category.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {category.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              {category.is_active ? 'Aktif' : 'Pasif'}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {category.children?.map(child => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const filteredCategories = categories.filter(cat =>
    (cat.translations?.name || cat.slug).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Kategori Yönetimi</h1>
          <p className="text-gray-600 mt-1">Ürün kategorilerini ve özelliklerini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
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
            onClick={() => navigate('/admin/categories/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kategori</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kategori ara..."
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Üst Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Özellikler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sıralama
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
              {buildCategoryTree(filteredCategories).map(category => renderCategoryRow(category))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kategori</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Folder className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ana Kategori</p>
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(c => !c.parent_id).length}
              </p>
            </div>
            <FolderOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alt Kategori</p>
              <p className="text-2xl font-bold text-purple-600">
                {categories.filter(c => c.parent_id).length}
              </p>
            </div>
            <Folder className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Özellik</p>
              <p className="text-2xl font-bold text-orange-600">{attributes.length}</p>
            </div>
            <Tag className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
