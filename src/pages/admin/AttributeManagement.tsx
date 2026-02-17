import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Tag,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  Hash,
  ToggleLeft,
  List,
  CheckSquare,
  Filter
} from 'lucide-react';
import { supabase, ProductAttribute, ProductAttributeValue } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ExtendedProductAttribute extends ProductAttribute {
  values?: ProductAttributeValue[];
}

const AttributeManagement = () => {
  const [attributes, setAttributes] = useState<ExtendedProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedAttributeId, setExpandedAttributeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'select' as 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color',
    scope: 'product' as 'product' | 'variant' | 'both',
    is_filterable: true,
    is_required: false,
    applies_to_all_categories: false,
    sort_order: 0,
    options: [] as string[],
    validation_rules: {},
    is_active: true
  });
  const [valueFormData, setValueFormData] = useState({
    attribute_id: '',
    value: '',
    display_value: '',
    color_code: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [showValueForm, setShowValueForm] = useState<string | null>(null);

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select(`
          *,
          values:product_attribute_values(*)
        `)
        .order('sort_order');

      if (error) throw error;
      setAttributes(data || []);
    } catch (error) {
      console.error('Error loading attributes:', error);
      toast.error('Ozellikler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let attributeId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('product_attributes')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        await supabase
          .from('translations')
          .update({
            translation_value: formData.name,
            updated_at: new Date().toISOString()
          })
          .eq('translation_key', `attribute.${editingId}.name`)
          .eq('language_code', 'tr');

        toast.success('Ozellik guncellendi');
      } else {
        const { data, error } = await supabase
          .from('product_attributes')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        attributeId = data.id;

        const supported_langs = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ru', 'ar'];
        const translationInserts = supported_langs.map(lang => ({
          translation_key: `attribute.${attributeId}.name`,
          language_code: lang,
          translation_value: formData.name,
          context: 'attribute',
          auto_translated: lang !== 'tr'
        }));

        await supabase.from('translations').insert(translationInserts);

        toast.success('Yeni ozellik eklendi');
      }

      resetForm();
      loadAttributes();
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error('Kaydetme sirasinda hata olustu');
    }
  };

  const handleValueSubmit = async (e: React.FormEvent, attributeId: string) => {
    e.preventDefault();

    try {
      const valueData = { ...valueFormData, attribute_id: attributeId };

      if (editingValueId) {
        const { error } = await supabase
          .from('product_attribute_values')
          .update(valueData)
          .eq('id', editingValueId);

        if (error) throw error;
        toast.success('Deger guncellendi');
      } else {
        const { error } = await supabase
          .from('product_attribute_values')
          .insert([valueData]);

        if (error) throw error;
        toast.success('Yeni deger eklendi');
      }

      resetValueForm();
      loadAttributes();
    } catch (error) {
      console.error('Error saving attribute value:', error);
      toast.error('Kaydetme sirasinda hata olustu');
    }
  };

  const handleEdit = (attribute: ExtendedProductAttribute) => {
    setFormData({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      scope: attribute.scope,
      is_filterable: attribute.is_filterable,
      is_required: attribute.is_required,
      applies_to_all_categories: attribute.applies_to_all_categories,
      sort_order: attribute.sort_order,
      options: attribute.options || [],
      validation_rules: attribute.validation_rules || {},
      is_active: attribute.is_active
    });
    setEditingId(attribute.id);
    setShowAddForm(true);
  };

  const handleValueEdit = (value: ProductAttributeValue) => {
    setValueFormData({
      attribute_id: value.attribute_id,
      value: value.value,
      display_value: value.display_value,
      color_code: value.color_code || '',
      image_url: value.image_url || '',
      sort_order: value.sort_order,
      is_active: value.is_active
    });
    setEditingValueId(value.id);
    setShowValueForm(value.attribute_id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ozelligi silmek istediginizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Ozellik silindi');
      loadAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Silme sirasinda hata olustu');
    }
  };

  const handleValueDelete = async (id: string) => {
    if (!confirm('Bu degeri silmek istediginizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('product_attribute_values')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Deger silindi');
      loadAttributes();
    } catch (error) {
      console.error('Error deleting value:', error);
      toast.error('Silme sirasinda hata olustu');
    }
  };

  const handleToggleActive = async (id: string, table: 'product_attributes' | 'product_attribute_values', isActive: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum guncellendi');
      loadAttributes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Guncelleme sirasinda hata olustu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'select',
      scope: 'product',
      is_filterable: true,
      is_required: false,
      applies_to_all_categories: false,
      sort_order: 0,
      options: [],
      validation_rules: {},
      is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const resetValueForm = () => {
    setValueFormData({
      attribute_id: '',
      value: '',
      display_value: '',
      color_code: '',
      image_url: '',
      sort_order: 0,
      is_active: true
    });
    setEditingValueId(null);
    setShowValueForm(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'number': return Hash;
      case 'boolean': return ToggleLeft;
      case 'select': return List;
      case 'multiselect': return CheckSquare;
      case 'color': return Palette;
      default: return Tag;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'text': return 'Metin';
      case 'number': return 'Sayi';
      case 'boolean': return 'Evet/Hayir';
      case 'select': return 'Secim Listesi';
      case 'multiselect': return 'Coklu Secim';
      case 'color': return 'Renk';
      default: return type;
    }
  };

  const getScopeText = (scope: string) => {
    switch (scope) {
      case 'product': return 'Urun';
      case 'variant': return 'Varyant';
      case 'both': return 'Her Ikisi';
      default: return scope;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAttributeId(expandedAttributeId === id ? null : id);
    setShowValueForm(null);
    resetValueForm();
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Urun Ozellikleri</h1>
          <p className="text-gray-600 mt-1">Dinamik urun ozelliklerini ve degerlerini yonetin</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ozellik Ekle</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Ozellik Duzenle' : 'Yeni Ozellik Ekle'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ozellik Adi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name)
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
                  Ozellik Turu *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="text">Metin</option>
                  <option value="number">Sayi</option>
                  <option value="boolean">Evet/Hayir</option>
                  <option value="select">Secim Listesi</option>
                  <option value="multiselect">Coklu Secim</option>
                  <option value="color">Renk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapsam *
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="product">Urun Seviyesi</option>
                  <option value="variant">Varyant Seviyesi</option>
                  <option value="both">Her Ikisi</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.scope === 'product' && 'IP sinifi, garanti gibi genel ozellikler'}
                  {formData.scope === 'variant' && 'Renk, boyut gibi varyant olusturan ozellikler'}
                  {formData.scope === 'both' && 'Her ikisinde de kullanilabilir'}
                </p>
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

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_filterable}
                  onChange={(e) => setFormData({ ...formData, is_filterable: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Filtrelenebilir</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.applies_to_all_categories}
                  onChange={(e) => setFormData({ ...formData, applies_to_all_categories: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Tum Kategorilerde Goster</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Zorunlu</span>
              </label>

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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {attributes.map((attribute) => {
          const IconComponent = getTypeIcon(attribute.type);
          const isExpanded = expandedAttributeId === attribute.id;
          const values = attribute.values || [];

          return (
            <div key={attribute.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(attribute.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <IconComponent className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{attribute.name}</h3>
                      <span className="text-xs text-gray-500">({attribute.slug})</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {getTypeText(attribute.type)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {getScopeText(attribute.scope)}
                      </span>
                      {attribute.is_filterable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          <Filter className="w-3 h-3 mr-1" />
                          Filtre
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {values.length} deger
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(attribute.id, 'product_attributes', attribute.is_active);
                    }}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      attribute.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {attribute.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {attribute.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(attribute);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(attribute.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Ozellik Degerleri</h4>
                    <button
                      onClick={() => {
                        setShowValueForm(attribute.id);
                        setEditingValueId(null);
                        setValueFormData({
                          attribute_id: attribute.id,
                          value: '',
                          display_value: '',
                          color_code: '',
                          image_url: '',
                          sort_order: values.length,
                          is_active: true
                        });
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Deger Ekle</span>
                    </button>
                  </div>

                  {showValueForm === attribute.id && (
                    <div className="bg-white rounded-lg p-4 mb-4 border">
                      <form onSubmit={(e) => handleValueSubmit(e, attribute.id)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Deger *
                            </label>
                            <input
                              type="text"
                              value={valueFormData.value}
                              onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Gorunen Ad
                            </label>
                            <input
                              type="text"
                              value={valueFormData.display_value}
                              onChange={(e) => setValueFormData({ ...valueFormData, display_value: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Bos birakilirsa deger kullanilir"
                            />
                          </div>

                          {attribute.type === 'color' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Renk Kodu
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={valueFormData.color_code || '#000000'}
                                  onChange={(e) => setValueFormData({ ...valueFormData, color_code: e.target.value })}
                                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={valueFormData.color_code}
                                  onChange={(e) => setValueFormData({ ...valueFormData, color_code: e.target.value })}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Siralama
                            </label>
                            <input
                              type="number"
                              value={valueFormData.sort_order}
                              onChange={(e) => setValueFormData({ ...valueFormData, sort_order: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={valueFormData.is_active}
                              onChange={(e) => setValueFormData({ ...valueFormData, is_active: e.target.checked })}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Aktif</span>
                          </label>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={resetValueForm}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                            >
                              Iptal
                            </button>
                            <button
                              type="submit"
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              <span>Kaydet</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {values.length > 0 ? (
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deger</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gorunen Ad</th>
                            {attribute.type === 'color' && (
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Renk</th>
                            )}
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sira</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Islemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {values.sort((a, b) => a.sort_order - b.sort_order).map((value) => (
                            <tr key={value.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{value.value}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{value.display_value || '-'}</td>
                              {attribute.type === 'color' && (
                                <td className="px-4 py-2">
                                  {value.color_code ? (
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: value.color_code }}
                                      />
                                      <span className="text-xs text-gray-500">{value.color_code}</span>
                                    </div>
                                  ) : '-'}
                                </td>
                              )}
                              <td className="px-4 py-2 text-sm text-gray-500">{value.sort_order}</td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => handleToggleActive(value.id, 'product_attribute_values', value.is_active)}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    value.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {value.is_active ? 'Aktif' : 'Pasif'}
                                </button>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleValueEdit(value)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleValueDelete(value.id)}
                                    className="text-red-600 hover:text-red-800"
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
                  ) : (
                    <div className="bg-white rounded-lg border p-8 text-center">
                      <p className="text-gray-500">Bu ozellik icin henuz deger eklenmemis.</p>
                      <p className="text-sm text-gray-400 mt-1">Yukaridaki "Deger Ekle" butonunu kullanarak deger ekleyebilirsiniz.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {attributes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henuz ozellik eklenmemis</h3>
          <p className="text-gray-500 mb-4">Urunleriniz icin ozellikler tanimlayin.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ilk Ozelligi Ekle</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ozellik Turleri Rehberi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Type className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium">Metin</h4>
            </div>
            <p className="text-sm text-gray-600">Serbest metin girisi icin (marka, model)</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Hash className="w-5 h-5 text-green-500" />
              <h4 className="font-medium">Sayi</h4>
            </div>
            <p className="text-sm text-gray-600">Sayisal degerler icin (guc, voltaj)</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Palette className="w-5 h-5 text-pink-500" />
              <h4 className="font-medium">Renk</h4>
            </div>
            <p className="text-sm text-gray-600">Renk secimi icin hex kod destegi ile</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <List className="w-5 h-5 text-orange-500" />
              <h4 className="font-medium">Secim Listesi</h4>
            </div>
            <p className="text-sm text-gray-600">Tek secim icin dropdown liste</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckSquare className="w-5 h-5 text-cyan-500" />
              <h4 className="font-medium">Coklu Secim</h4>
            </div>
            <p className="text-sm text-gray-600">Birden fazla secim icin checkbox</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <ToggleLeft className="w-5 h-5 text-red-500" />
              <h4 className="font-medium">Evet/Hayir</h4>
            </div>
            <p className="text-sm text-gray-600">Boolean degerler icin switch</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeManagement;
