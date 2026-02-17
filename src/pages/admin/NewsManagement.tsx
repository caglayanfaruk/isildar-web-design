import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Eye, EyeOff, Search, Filter, Calendar, AlertTriangle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveAndTranslate } from '../../services/unifiedTranslationService';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/admin/RichTextEditor';
import MediaSelector from '../../components/MediaSelector';

interface NewsItem {
  id: string;
  slug: string;
  author_id: string;
  status: string;
  urgent: boolean;
  external: boolean;
  source?: string;
  views: number;
  featured_image_id?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  translations?: {
    title: string;
    excerpt: string;
    content: string;
  };
  author?: {
    first_name: string;
    last_name: string;
  };
}

const NewsManagement = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const [formData, setFormData] = useState({
    slug: '',
    status: 'draft',
    urgent: false,
    external: false,
    source: '',
    meta_title: '',
    meta_description: '',
    published_at: '',
    featured_image_id: '' as string | null,
    translations: {
      title: '',
      excerpt: '',
      content: ''
    }
  });
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, [selectedStatus, searchTerm]);

  const loadNews = async () => {
    try {
      let query = supabase
        .from('news')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Load translations for each news item
      const newsWithTranslations = await Promise.all(
        (data || []).map(async (newsItem) => {
          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .in('translation_key', [
              `news.${newsItem.slug}.title`,
              `news.${newsItem.slug}.excerpt`,
              `news.${newsItem.slug}.content`
            ]);

          const translationMap: any = {};
          translations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            translationMap[key] = t.translation_value;
          });

          return {
            ...newsItem,
            translations: translationMap
          };
        })
      );

      setNews(newsWithTranslations);
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Haberler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newsData: any = {
        slug: formData.slug,
        status: formData.status,
        urgent: formData.urgent,
        external: formData.external,
        source: formData.source || null,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        published_at: formData.published_at || null,
        featured_image_id: formData.featured_image_id || null,
        author_id: '00000000-0000-0000-0000-000000000000',
      };

      let newsId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('news')
          .insert([newsData])
          .select()
          .single();

        if (error) throw error;
        newsId = data.id;
      }

      // Otomatik çeviri: Türkçe metinleri tüm dillere çevir ve kaydet
      if (formData.translations.title) {
        await saveAndTranslate(
          formData.translations.title,
          `news.${formData.slug}.title`,
          'news',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (formData.translations.excerpt) {
        await saveAndTranslate(
          formData.translations.excerpt,
          `news.${formData.slug}.excerpt`,
          'news',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (formData.translations.content) {
        await saveAndTranslate(
          formData.translations.content,
          `news.${formData.slug}.content`,
          'news',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      toast.success(editingId ? 'Haber güncellendi' : 'Yeni haber eklendi');
      resetForm();
      loadNews();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleEdit = async (newsItem: NewsItem) => {
    setFormData({
      slug: newsItem.slug,
      status: newsItem.status,
      urgent: newsItem.urgent,
      external: newsItem.external,
      source: newsItem.source || '',
      meta_title: newsItem.meta_title || '',
      meta_description: newsItem.meta_description || '',
      published_at: newsItem.published_at ? newsItem.published_at.split('T')[0] : '',
      featured_image_id: newsItem.featured_image_id || null,
      translations: {
        title: newsItem.translations?.title || '',
        excerpt: newsItem.translations?.excerpt || '',
        content: newsItem.translations?.content || ''
      }
    });
    if (newsItem.featured_image_id) {
      const { data: media } = await supabase
        .from('media')
        .select('url')
        .eq('id', newsItem.featured_image_id)
        .maybeSingle();
      setFeaturedImageUrl(media?.url || null);
    } else {
      setFeaturedImageUrl(null);
    }
    setEditingId(newsItem.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu haberi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Haber silindi');
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('news')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadNews();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      status: 'draft',
      urgent: false,
      external: false,
      source: '',
      meta_title: '',
      meta_description: '',
      published_at: '',
      featured_image_id: null,
      translations: {
        title: '',
        excerpt: '',
        content: ''
      }
    });
    setFeaturedImageUrl(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const generateSlug = (title: string) => {
    return title
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Haber Yönetimi</h1>
          <p className="text-gray-600 mt-1">Haberleri yönetin</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Haber</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇺🇸 English</option>
              <option value="de">🇩🇪 Deutsch</option>
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
              <option value="draft">Taslak</option>
              <option value="published">Yayınlandı</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Haber ara..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Haber Düzenle' : 'Yeni Haber Ekle'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık ({currentLanguage.toUpperCase()}) *
                </label>
                <input
                  type="text"
                  value={formData.translations.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      slug: generateSlug(title),
                      translations: {
                        ...formData.translations,
                        title
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
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayınla</option>
                  <option value="archived">Arşivle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kaynak
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IŞILDAR, Sektör Raporu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yayın Tarihi
                </label>
                <input
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapak Görseli
              </label>
              <div className="flex items-start space-x-4">
                {featuredImageUrl ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={featuredImageUrl} alt="Kapak" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, featured_image_id: null });
                        setFeaturedImageUrl(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">Gorsel Sec</span>
                  </button>
                )}
                {featuredImageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Degistir
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Özet ({currentLanguage.toUpperCase()}) *
              </label>
              <textarea
                value={formData.translations.excerpt}
                onChange={(e) => setFormData({
                  ...formData,
                  translations: {
                    ...formData.translations,
                    excerpt: e.target.value
                  }
                })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İçerik ({currentLanguage.toUpperCase()}) *
              </label>
              <RichTextEditor
                value={formData.translations.content}
                onChange={(value) => setFormData({
                  ...formData,
                  translations: {
                    ...formData.translations,
                    content: value
                  }
                })}
                placeholder="Haber içeriğini buraya yazın..."
                height="500px"
              />
            </div>

            {/* SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Başlık
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Açıklama
                </label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Acil Haber</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.external}
                  onChange={(e) => setFormData({ ...formData, external: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Dış Kaynak</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
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
        </div>
      )}

      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={async (ids) => {
          if (ids.length > 0) {
            setFormData({ ...formData, featured_image_id: ids[0] });
            const { data: media } = await supabase
              .from('media')
              .select('url')
              .eq('id', ids[0])
              .maybeSingle();
            setFeaturedImageUrl(media?.url || null);
          }
        }}
        selectedIds={formData.featured_image_id ? [formData.featured_image_id] : []}
      />

      {/* News List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kaynak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İstatistikler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {news.map((newsItem) => (
                <tr key={newsItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {newsItem.urgent && (
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          {newsItem.external && (
                            <ExternalLink className="w-4 h-4 text-blue-500 mr-2" />
                          )}
                          {newsItem.translations?.title || newsItem.slug}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{newsItem.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {newsItem.source || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(newsItem.id, newsItem.status)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        newsItem.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : newsItem.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {newsItem.status === 'published' ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {newsItem.status === 'published' ? 'Yayında' : newsItem.status === 'draft' ? 'Taslak' : 'Arşiv'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>👁️ {newsItem.views} görüntülenme</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{new Date(newsItem.created_at).toLocaleDateString('tr-TR')}</div>
                      {newsItem.published_at && (
                        <div className="text-xs text-green-600">
                          Yayın: {new Date(newsItem.published_at).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(newsItem)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(newsItem.id)}
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
      </div>
    </div>
  );
};

export default NewsManagement;