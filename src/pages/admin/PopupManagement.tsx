import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';

interface PopupAnnouncement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
  desktop_width: number;
  desktop_height: number;
  tablet_width: number;
  tablet_height: number;
  mobile_width: number;
  mobile_height: number;
  cookie_duration_days: number;
  always_show: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const PopupManagement: React.FC = () => {
  const [popups, setPopups] = useState<PopupAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupAnnouncement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    link_text: 'Detaylı Bilgi',
    desktop_width: 600,
    desktop_height: 400,
    tablet_width: 500,
    tablet_height: 350,
    mobile_width: 90,
    mobile_height: 300,
    cookie_duration_days: 7,
    always_show: false,
    is_active: false,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      const { data, error } = await supabase
        .from('popup_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopups(data || []);
    } catch (error: any) {
      toast.error('Popup duyurular yüklenirken hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editingPopup) {
        const { error } = await supabase
          .from('popup_announcements')
          .update(payload)
          .eq('id', editingPopup.id);

        if (error) throw error;
        toast.success('Popup başarıyla güncellendi!');
      } else {
        const { error } = await supabase
          .from('popup_announcements')
          .insert([payload]);

        if (error) throw error;
        toast.success('Popup başarıyla oluşturuldu!');
      }

      resetForm();
      fetchPopups();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const handleEdit = (popup: PopupAnnouncement) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      content: popup.content,
      image_url: popup.image_url || '',
      link_url: popup.link_url || '',
      link_text: popup.link_text,
      desktop_width: popup.desktop_width,
      desktop_height: popup.desktop_height,
      tablet_width: popup.tablet_width,
      tablet_height: popup.tablet_height,
      mobile_width: popup.mobile_width,
      mobile_height: popup.mobile_height,
      cookie_duration_days: popup.cookie_duration_days,
      always_show: popup.always_show,
      is_active: popup.is_active,
      start_date: popup.start_date ? popup.start_date.split('T')[0] : '',
      end_date: popup.end_date ? popup.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu popup\'ı silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('popup_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Popup başarıyla silindi!');
      fetchPopups();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const toggleActive = async (popup: PopupAnnouncement) => {
    try {
      const { error } = await supabase
        .from('popup_announcements')
        .update({ is_active: !popup.is_active })
        .eq('id', popup.id);

      if (error) throw error;
      toast.success(`Popup ${!popup.is_active ? 'aktif' : 'pasif'} edildi!`);
      fetchPopups();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      link_url: '',
      link_text: 'Detaylı Bilgi',
      desktop_width: 600,
      desktop_height: 400,
      tablet_width: 500,
      tablet_height: 350,
      mobile_width: 90,
      mobile_height: 300,
      cookie_duration_days: 7,
      always_show: false,
      is_active: false,
      start_date: '',
      end_date: '',
    });
    setEditingPopup(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Popup Duyuru Yönetimi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'İptal' : 'Yeni Popup'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPopup ? 'Popup Düzenle' : 'Yeni Popup Oluştur'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel
                </label>
                <ImageUploadSelector
                  value={formData.image_url}
                  onChange={(mediaId, url) => setFormData({ ...formData, image_url: url })}
                  folder="popup-images"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Buton Metni
                </label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Boyut Ayarları</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desktop Genişlik (px)
                  </label>
                  <input
                    type="number"
                    value={formData.desktop_width}
                    onChange={(e) => setFormData({ ...formData, desktop_width: parseInt(e.target.value) })}
                    min="200"
                    max="1200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desktop Yükseklik (px)
                  </label>
                  <input
                    type="number"
                    value={formData.desktop_height}
                    onChange={(e) => setFormData({ ...formData, desktop_height: parseInt(e.target.value) })}
                    min="200"
                    max="800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tablet Genişlik (px)
                  </label>
                  <input
                    type="number"
                    value={formData.tablet_width}
                    onChange={(e) => setFormData({ ...formData, tablet_width: parseInt(e.target.value) })}
                    min="200"
                    max="800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tablet Yükseklik (px)
                  </label>
                  <input
                    type="number"
                    value={formData.tablet_height}
                    onChange={(e) => setFormData({ ...formData, tablet_height: parseInt(e.target.value) })}
                    min="200"
                    max="600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobil Genişlik (%)
                  </label>
                  <input
                    type="number"
                    value={formData.mobile_width}
                    onChange={(e) => setFormData({ ...formData, mobile_width: parseInt(e.target.value) })}
                    min="70"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobil Yükseklik (px)
                  </label>
                  <input
                    type="number"
                    value={formData.mobile_height}
                    onChange={(e) => setFormData({ ...formData, mobile_height: parseInt(e.target.value) })}
                    min="200"
                    max="600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Gösterim Ayarları</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cookie Süresi (Gün)
                  </label>
                  <input
                    type="number"
                    value={formData.cookie_duration_days}
                    onChange={(e) => setFormData({ ...formData, cookie_duration_days: parseInt(e.target.value) })}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kullanıcı popup'ı kapattıktan sonra kaç gün tekrar gösterilmeyecek
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.always_show}
                    onChange={(e) => setFormData({ ...formData, always_show: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Her Zaman Göster (Cookie'den Bağımsız)
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Yasal uyarılar ve zorunlu duyurular için. Aktif olduğunda popup her ziyarette görüntülenir.
                </p>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Popup Aktif
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingPopup ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Başlık
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Boyutlar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gösterim
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih Aralığı
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
            {popups.map((popup) => (
              <tr key={popup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{popup.title}</div>
                  {popup.image_url && (
                    <img src={popup.image_url} alt={popup.title} className="mt-2 h-12 w-auto rounded" />
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>D: {popup.desktop_width}x{popup.desktop_height}px</div>
                  <div>T: {popup.tablet_width}x{popup.tablet_height}px</div>
                  <div>M: {popup.mobile_width}%x{popup.mobile_height}px</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {popup.always_show ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Her Zaman Göster
                    </span>
                  ) : (
                    <span className="text-gray-500">Cookie: {popup.cookie_duration_days} gün</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {popup.start_date && (
                    <div>{new Date(popup.start_date).toLocaleDateString('tr-TR')}</div>
                  )}
                  {popup.end_date && (
                    <div>- {new Date(popup.end_date).toLocaleDateString('tr-TR')}</div>
                  )}
                  {!popup.start_date && !popup.end_date && '-'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(popup)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      popup.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {popup.is_active ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Aktif
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Pasif
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(popup)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(popup.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {popups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Henüz popup duyurusu oluşturulmamış
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PopupManagement;
