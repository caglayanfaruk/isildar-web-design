import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, X, Link, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface FooterSection {
  id: string;
  title: string;
  type: 'links' | 'contact' | 'social' | 'text';
  content: any;
  order: number;
  is_active: boolean;
}

interface FooterLink {
  title: string;
  url: string;
  target: '_self' | '_blank';
  icon?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const FooterManagement = () => {
  const [footerData, setFooterData] = useState({
    copyright_text: '',
    company_description: '',
    show_social_links: true,
    show_contact_info: true,
    show_newsletter: true
  });
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'social'>('general');
  const [currentLanguage, setCurrentLanguage] = useState('tr');

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      // Load general footer settings
      const { data: footerSettings, error: footerError } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'footer')
        .eq('is_public', true);

      if (footerError) throw footerError;

      if (footerSettings && footerSettings.length > 0) {
        const footerObj: any = {};
        footerSettings.forEach((setting: Setting) => {
          footerObj[setting.key] = setting.value;
        });
        setFooterData({ ...footerData, ...footerObj });
      }

      // Load footer sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'footer_sections')
        .eq('is_public', true)
        .order('created_at');

      if (sectionsError) throw sectionsError;

      if (sectionsData) {
        const sectionsArray = sectionsData.map(section => ({
          id: section.id,
          ...section.value
        }));
        setFooterSections(sectionsArray);
      }

    } catch (error) {
      console.error('Error loading footer data:', error);
      toast.error('Footer verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      // Delete existing footer settings
      await supabase
        .from('settings')
        .delete()
        .eq('category', 'footer');

      // Insert new footer settings
      const footerSettings = Object.entries(footerData)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => ({
          key: key,
          value: value,
          type: typeof value === 'boolean' ? 'boolean' : 'text',
          category: 'footer',
          description: `Footer ${key.replace('_', ' ')}`,
          is_public: true
        }));

      if (footerSettings.length > 0) {
        const { error } = await supabase
          .from('settings')
          .insert(footerSettings);

        if (error) throw error;
      }

      toast.success('Footer ayarları kaydedildi');
    } catch (error) {
      console.error('Error saving footer data:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section: FooterSection) => {
    try {
      if (section.id && section.id !== 'new') {
        // Update existing
        const { error } = await supabase
          .from('settings')
          .update({
            value: {
              title: section.title,
              type: section.type,
              content: section.content,
              order: section.order,
              is_active: section.is_active
            }
          })
          .eq('id', section.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('settings')
          .insert({
            key: `footer_section_${Date.now()}`,
            value: {
              title: section.title,
              type: section.type,
              content: section.content,
              order: section.order,
              is_active: section.is_active
            },
            type: 'json',
            category: 'footer_sections',
            description: 'Footer section',
            is_public: true
          });

        if (error) throw error;
      }

      toast.success('Footer bölümü kaydedildi');
      loadFooterData();
      setEditingSection(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Bu bölümü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Bölüm silindi');
      loadFooterData();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const tabs = [
    { id: 'general', name: 'Genel Ayarlar', icon: Globe },
    { id: 'sections', name: 'Footer Bölümleri', icon: Link },
    { id: 'social', name: 'Sosyal Medya', icon: Globe }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Footer Yönetimi</h1>
          <p className="text-gray-600 mt-1">Site alt bilgi bölümünü yönetin</p>
        </div>
        {activeTab === 'general' && (
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        )}
        {activeTab === 'sections' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Bölüm</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
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

      {/* Content */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telif Hakkı Metni
              </label>
              <input
                type="text"
                value={footerData.copyright_text}
                onChange={(e) => setFooterData({ ...footerData, copyright_text: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="© 2025 IŞILDAR Aydınlatma Teknolojileri. Tüm hakları saklıdır."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şirket Açıklaması
              </label>
              <textarea
                value={footerData.company_description}
                onChange={(e) => setFooterData({ ...footerData, company_description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1972 yılından bu yana aydınlatma sektöründe..."
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Görünürlük Ayarları</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={footerData.show_social_links}
                    onChange={(e) => setFooterData({ ...footerData, show_social_links: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sosyal medya linklerini göster</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={footerData.show_contact_info}
                    onChange={(e) => setFooterData({ ...footerData, show_contact_info: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">İletişim bilgilerini göster</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={footerData.show_newsletter}
                    onChange={(e) => setFooterData({ ...footerData, show_newsletter: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Newsletter abone formunu göster</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Sections List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {footerSections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Tür: {section.type === 'links' ? 'Linkler' : section.type === 'contact' ? 'İletişim' : section.type === 'social' ? 'Sosyal Medya' : 'Metin'}
                </div>
                <div className="text-sm text-gray-500">
                  Sıra: {section.order} | {section.is_active ? 'Aktif' : 'Pasif'}
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingSection) && (
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingSection ? 'Bölüm Düzenle' : 'Yeni Bölüm Ekle'}
                </h3>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    setShowAddForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const section: FooterSection = {
                    id: editingSection?.id || 'new',
                    title: formData.get('title') as string,
                    type: formData.get('type') as any,
                    content: {},
                    order: parseInt(formData.get('order') as string) || 0,
                    is_active: formData.get('is_active') === 'on'
                  };
                  handleSaveSection(section);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bölüm Başlığı *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingSection?.title || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bölüm Türü *
                  </label>
                  <select
                    name="type"
                    defaultValue={editingSection?.type || 'links'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="links">Linkler</option>
                    <option value="contact">İletişim</option>
                    <option value="social">Sosyal Medya</option>
                    <option value="text">Metin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    name="order"
                    defaultValue={editingSection?.order || 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={editingSection?.is_active !== false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Aktif</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setShowAddForm(false);
                    }}
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
        </div>
      )}

      {activeTab === 'social' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <p className="text-gray-500">Sosyal medya yönetimi yakında eklenecek...</p>
        </div>
      )}
    </div>
  );
};

export default FooterManagement;