import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';

interface Slider {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SliderItem {
  id?: string;
  slider_id: string;
  image_id: string;
  title_tr: string;
  title_en: string;
  subtitle_tr: string;
  subtitle_en: string;
  accent_tr: string;
  accent_en: string;
  button_text_tr: string;
  button_text_en: string;
  button_link: string;
  sort_order: number;
  is_active: boolean;
  link_url?: string;
  link_target: string;
  media?: {
    id: string;
    url: string;
    filename: string;
  };
}

const SliderManagement = () => {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [selectedSliderId, setSelectedSliderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'sliders' | 'items'>('sliders');

  const [formData, setFormData] = useState({
    name: '',
    location: 'homepage',
    is_active: true
  });

  const [itemFormData, setItemFormData] = useState<SliderItem>({
    slider_id: '',
    image_id: '',
    title_tr: '',
    title_en: '',
    subtitle_tr: '',
    subtitle_en: '',
    accent_tr: '',
    accent_en: '',
    button_text_tr: 'Ürünleri Keşfet',
    button_text_en: 'Explore Products',
    button_link: '',
    sort_order: 0,
    is_active: true,
    link_url: '',
    link_target: '_self'
  });

  useEffect(() => {
    loadSliders();
  }, []);

  useEffect(() => {
    if (selectedSliderId) {
      loadSliderItems();
    }
  }, [selectedSliderId]);

  const loadSliders = async () => {
    try {
      const { data, error } = await supabase
        .from('sliders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSliders(data || []);
      if (data && data.length > 0 && !selectedSliderId) {
        setSelectedSliderId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sliders:', error);
      toast.error('Sliderlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadSliderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_items')
        .select(`
          *,
          media:image_id (
            id,
            url,
            filename
          )
        `)
        .eq('slider_id', selectedSliderId)
        .order('sort_order');

      if (error) throw error;
      setSliderItems(data || []);
    } catch (error) {
      console.error('Error loading slider items:', error);
      toast.error('Slider öğeleri yüklenirken hata oluştu');
    }
  };

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('sliders')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Slider güncellendi');
      } else {
        const { error } = await supabase
          .from('sliders')
          .insert([formData]);

        if (error) throw error;
        toast.success('Yeni slider eklendi');
      }

      resetForm();
      loadSliders();
    } catch (error) {
      console.error('Error saving slider:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemFormData.image_id) {
      toast.error('Lütfen bir görsel seçin');
      return;
    }

    try {
      const itemData = { ...itemFormData, slider_id: selectedSliderId };
      delete itemData.media;

      if (editingId) {
        const { error } = await supabase
          .from('slider_items')
          .update(itemData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Slider öğesi güncellendi');
      } else {
        const { error } = await supabase
          .from('slider_items')
          .insert([itemData]);

        if (error) throw error;
        toast.success('Yeni slider öğesi eklendi');
      }

      resetItemForm();
      loadSliderItems();
    } catch (error) {
      console.error('Error saving slider item:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleSliderEdit = (slider: Slider) => {
    setFormData({
      name: slider.name,
      location: slider.location,
      is_active: slider.is_active
    });
    setEditingId(slider.id);
    setShowAddForm(true);
    setActiveTab('sliders');
  };

  const handleItemEdit = (item: SliderItem) => {
    setItemFormData({
      slider_id: item.slider_id,
      image_id: item.image_id,
      title_tr: item.title_tr || '',
      title_en: item.title_en || '',
      subtitle_tr: item.subtitle_tr || '',
      subtitle_en: item.subtitle_en || '',
      accent_tr: item.accent_tr || '',
      accent_en: item.accent_en || '',
      button_text_tr: item.button_text_tr || 'Ürünleri Keşfet',
      button_text_en: item.button_text_en || 'Explore Products',
      button_link: item.button_link || '',
      sort_order: item.sort_order,
      is_active: item.is_active,
      link_url: item.link_url || '',
      link_target: item.link_target
    });
    setEditingId(item.id || null);
    setShowAddForm(true);
    setActiveTab('items');
  };

  const handleSliderDelete = async (id: string) => {
    if (!confirm('Bu sliderı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('sliders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Slider silindi');
      loadSliders();
    } catch (error) {
      console.error('Error deleting slider:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleItemDelete = async (id: string) => {
    if (!confirm('Bu slider öğesini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('slider_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Slider öğesi silindi');
      loadSliderItems();
    } catch (error) {
      console.error('Error deleting slider item:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, table: 'sliders' | 'slider_items', isActive: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');

      if (table === 'sliders') {
        loadSliders();
      } else {
        loadSliderItems();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentItem = sliderItems.find(item => item.id === id);
      if (!currentItem) return;

      const newOrder = direction === 'up' ? currentItem.sort_order - 1 : currentItem.sort_order + 1;

      const { error } = await supabase
        .from('slider_items')
        .update({ sort_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      toast.success('Sıralama güncellendi');
      loadSliderItems();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: 'homepage',
      is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const resetItemForm = () => {
    setItemFormData({
      slider_id: selectedSliderId,
      image_id: '',
      title_tr: '',
      title_en: '',
      subtitle_tr: '',
      subtitle_en: '',
      accent_tr: '',
      accent_en: '',
      button_text_tr: 'Ürünleri Keşfet',
      button_text_en: 'Explore Products',
      button_link: '',
      sort_order: 0,
      is_active: true,
      link_url: '',
      link_target: '_self'
    });
    setEditingId(null);
    setShowAddForm(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Slider Yönetimi</h1>
          <p className="text-gray-600 mt-1">Ana sayfa sliderlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'sliders') {
              setShowAddForm(true);
            } else {
              setItemFormData({ ...itemFormData, slider_id: selectedSliderId });
              setShowAddForm(true);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'sliders' ? 'Yeni Slider' : 'Yeni Öğe'} Ekle</span>
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sliders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sliders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sliderlar
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Slider Öğeleri
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slider Seçin
          </label>
          <select
            value={selectedSliderId}
            onChange={(e) => setSelectedSliderId(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sliders.map((slider) => (
              <option key={slider.id} value={slider.id}>
                {slider.name} ({slider.location})
              </option>
            ))}
          </select>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId
                ? (activeTab === 'sliders' ? 'Slider Düzenle' : 'Slider Öğesi Düzenle')
                : (activeTab === 'sliders' ? 'Yeni Slider Ekle' : 'Yeni Slider Öğesi Ekle')
              }
            </h2>
            <button
              onClick={() => {
                if (activeTab === 'sliders') {
                  resetForm();
                } else {
                  resetItemForm();
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeTab === 'sliders' ? (
            <form onSubmit={handleSliderSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slider Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konum *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="homepage">Ana Sayfa</option>
                  <option value="about">Hakkımızda</option>
                  <option value="products">Ürünler</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
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
          ) : (
            <form onSubmit={handleItemSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel *
                </label>
                <ImageUploadSelector
                  value={itemFormData.image_id}
                  onChange={(mediaId, url) => setItemFormData({ ...itemFormData, image_id: mediaId })}
                  label="Slider Görseli"
                  folder="sliders"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık (Türkçe) *
                  </label>
                  <input
                    type="text"
                    value={itemFormData.title_tr}
                    onChange={(e) => setItemFormData({ ...itemFormData, title_tr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Anahtar Priz Grubu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık (İngilizce) *
                  </label>
                  <input
                    type="text"
                    value={itemFormData.title_en}
                    onChange={(e) => setItemFormData({ ...itemFormData, title_en: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Switch Socket Group"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Başlık (Türkçe)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.subtitle_tr}
                    onChange={(e) => setItemFormData({ ...itemFormData, subtitle_tr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Kaliteli anahtar ve priz çeşitleri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Başlık (İngilizce)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.subtitle_en}
                    onChange={(e) => setItemFormData({ ...itemFormData, subtitle_en: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Quality switches and sockets"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Metni (Türkçe)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.accent_tr}
                    onChange={(e) => setItemFormData({ ...itemFormData, accent_tr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Elektrik Malzemeleri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Metni (İngilizce)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.accent_en}
                    onChange={(e) => setItemFormData({ ...itemFormData, accent_en: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Electrical Supplies"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buton Metni (Türkçe)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.button_text_tr}
                    onChange={(e) => setItemFormData({ ...itemFormData, button_text_tr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buton Metni (İngilizce)
                  </label>
                  <input
                    type="text"
                    value={itemFormData.button_text_en}
                    onChange={(e) => setItemFormData({ ...itemFormData, button_text_en: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buton Linki
                  </label>
                  <input
                    type="text"
                    value={itemFormData.button_link}
                    onChange={(e) => setItemFormData({ ...itemFormData, button_link: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/products"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    value={itemFormData.sort_order}
                    onChange={(e) => setItemFormData({ ...itemFormData, sort_order: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={itemFormData.is_active}
                      onChange={(e) => setItemFormData({ ...itemFormData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
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
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {activeTab === 'sliders' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slider Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sliders.map((slider) => (
                  <tr key={slider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {slider.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {slider.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(slider.id, 'sliders', slider.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          slider.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {slider.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {slider.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(slider.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSliderEdit(slider)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSliderDelete(slider.id)}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Görsel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Başlık
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
                {sliderItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.media ? (
                          <img
                            src={item.media.url}
                            alt={item.title_tr}
                            className="h-16 w-24 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.title_tr}</div>
                      <div className="text-sm text-gray-500">{item.subtitle_tr}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{item.sort_order}</span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleReorder(item.id!, 'up')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(item.id!, 'down')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(item.id!, 'slider_items', item.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {item.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleItemEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleItemDelete(item.id!)}
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
        )}
      </div>
    </div>
  );
};

export default SliderManagement;
