import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, FileText, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/admin/RichTextEditor';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';

interface Page {
  id: string;
  slug: string;
  title: string | null;
  template: string;
  status: string;
  content: string | null;
  featured_image_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

const PagesManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    template: 'default',
    status: 'draft',
    content: '',
    featured_image_id: null as string | null,
    meta_title: '',
    meta_description: ''
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Sayfalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageId?: string) => {
    if (!formData.slug.trim()) {
      toast.error('Slug alanı zorunludur');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Başlık alanı zorunludur');
      return;
    }

    try {
      if (pageId) {
        const { error } = await supabase
          .from('pages')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);

        if (error) throw error;
        toast.success('Sayfa güncellendi');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('pages')
          .insert([formData]);

        if (error) throw error;
        toast.success('Sayfa oluşturuldu');
        setShowAddForm(false);
      }

      loadPages();
      resetForm();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Kaydetme hatası');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sayfa silindi');
      loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Silme hatası');
    }
  };

  const startEdit = (page: Page) => {
    setFormData({
      slug: page.slug,
      title: page.title || '',
      template: page.template,
      status: page.status,
      content: page.content || '',
      featured_image_id: page.featured_image_id,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || ''
    });
    setEditingId(page.id);
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      template: 'default',
      status: 'draft',
      content: '',
      featured_image_id: null,
      meta_title: '',
      meta_description: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const PageForm = ({ pageId }: { pageId?: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {pageId ? 'Sayfayı Düzenle' : 'Yeni Sayfa Oluştur'}
      </h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="hakkimizda"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Hakkımızda"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <select
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">Default</option>
              <option value="about">About</option>
              <option value="contact">Contact</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Öne Çıkan Görsel
          </label>
          <ImageUploadSelector
            selectedImageId={formData.featured_image_id}
            onImageSelect={(imageId) => setFormData({ ...formData, featured_image_id: imageId })}
            onImageRemove={() => setFormData({ ...formData, featured_image_id: null })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sayfa İçeriği
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Sayfa içeriğini buraya yazın..."
            height="400px"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO Ayarları</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="SEO başlığı"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="SEO açıklaması"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleSave(pageId)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Kaydet</span>
          </button>
          <button
            onClick={() => {
              if (pageId) {
                setEditingId(null);
              } else {
                setShowAddForm(false);
              }
              resetForm();
            }}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>İptal</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sayfa Yönetimi</h1>
          <p className="text-gray-600 mt-1">Özel sayfaları oluşturun ve yönetin</p>
        </div>
        {!showAddForm && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sayfa</span>
          </button>
        )}
      </div>

      {showAddForm && <PageForm />}
      {editingId && <PageForm pageId={editingId} />}

      {!showAddForm && !editingId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sayfa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{page.title || 'Başlıksız'}</div>
                          <div className="text-xs text-gray-500">{page.meta_title || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono">/{page.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{page.template}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : page.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {page.status === 'published' ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Yayında
                          </>
                        ) : page.status === 'draft' ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Taslak
                          </>
                        ) : (
                          'Arşivlendi'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEdit(page)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz sayfa oluşturulmamış</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  İlk sayfayı oluştur
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesManagement;
