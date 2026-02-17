import React, { useState, useEffect } from 'react';
import { Save, Globe, Settings, Shield, Package, Users } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_keywords: string;
  site_url: string;
  admin_email: string;
  support_email: string;
  default_language: string;
  timezone: string;
  date_format: string;
  currency: string;
  items_per_page: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
  meta_verification: string;
  google_verification: string;
}

const GeneralSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'ISILDAR Aydinlatma',
    site_description: 'Aydinlatma sektorunde 53 yillik deneyim ile kaliteli urunler',
    site_keywords: 'aydinlatma, LED, armatur, elektrik, ISILDAR',
    site_url: 'https://www.isildar.eu',
    admin_email: 'admin@isildar.eu',
    support_email: 'info@isildar.eu',
    default_language: 'tr',
    timezone: 'Europe/Istanbul',
    date_format: 'DD/MM/YYYY',
    currency: 'TRY',
    items_per_page: 20,
    maintenance_mode: false,
    maintenance_message: 'Site bakimda. Kisa sure sonra tekrar hizmetinizdeyiz.',
    google_analytics_id: '',
    facebook_pixel_id: '',
    meta_verification: '',
    google_verification: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'maintenance'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'general');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj: any = {};
        data.forEach((setting: Setting) => {
          let value = setting.value;
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // keep as string
            }
          }
          if (typeof value === 'string') {
            value = value.replace(/^"|"$/g, '');
          }
          settingsObj[setting.key] = value;
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Ayarlar yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text',
        category: 'general',
        description: `General setting: ${key.replace(/_/g, ' ')}`,
        is_public: true
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(settingsArray, {
          onConflict: 'key',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Kaydetme sirasinda hata olustu');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', name: 'Genel Ayarlar', icon: Settings },
    { id: 'seo', name: 'SEO & Analitik', icon: Globe },
    { id: 'maintenance', name: 'Bakim Modu', icon: Shield }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Genel Ayarlar</h1>
          <p className="text-gray-600 mt-1">Site genelinde gecerli ayarlari yonetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
        </button>
      </div>

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

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Adi *</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => handleSettingChange('site_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site URL *</label>
                  <input
                    type="url"
                    value={settings.site_url}
                    onChange={(e) => handleSettingChange('site_url', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Aciklamasi</label>
                  <textarea
                    value={settings.site_description}
                    onChange={(e) => handleSettingChange('site_description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anahtar Kelimeler</label>
                  <input
                    type="text"
                    value={settings.site_keywords}
                    onChange={(e) => handleSettingChange('site_keywords', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="aydinlatma, LED, armatur..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Iletisim Ayarlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin E-posta *</label>
                  <input
                    type="email"
                    value={settings.admin_email}
                    onChange={(e) => handleSettingChange('admin_email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destek E-posta *</label>
                  <input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => handleSettingChange('support_email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bolgesel Ayarlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Varsayilan Dil</label>
                  <select
                    value={settings.default_language}
                    onChange={(e) => handleSettingChange('default_language', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tr">Turkce</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zaman Dilimi</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Europe/Istanbul">Istanbul (UTC+3)</option>
                    <option value="Europe/London">Londra (UTC+0)</option>
                    <option value="Europe/Berlin">Berlin (UTC+1)</option>
                    <option value="America/New_York">New York (UTC-5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Formati</label>
                  <select
                    value={settings.date_format}
                    onChange={(e) => handleSettingChange('date_format', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TRY">TRY - Turk Lirasi</option>
                    <option value="USD">USD - Amerikan Dolari</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO & Analitik Kodlari</h3>
              <p className="text-sm text-gray-500 mb-4">
                Bu alanlara girilen degerler otomatik olarak sitenin HTML head bolumune eklenir.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                  <input
                    type="text"
                    value={settings.google_analytics_id}
                    onChange={(e) => handleSettingChange('google_analytics_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-gray-400 mt-1">Ornek: G-AB1CD2EF3G</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={settings.facebook_pixel_id}
                    onChange={(e) => handleSettingChange('facebook_pixel_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-gray-400 mt-1">Facebook Business Manager'dan alinir</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Site Verification</label>
                  <input
                    type="text"
                    value={settings.google_verification}
                    onChange={(e) => handleSettingChange('google_verification', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="google-site-verification kodu"
                  />
                  <p className="text-xs text-gray-400 mt-1">Google Search Console dogrulama kodu</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Verification</label>
                  <input
                    type="text"
                    value={settings.meta_verification}
                    onChange={(e) => handleSettingChange('meta_verification', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Meta verification kodu"
                  />
                  <p className="text-xs text-gray-400 mt-1">Facebook/Meta dogrulama kodu</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bakim Modu</h3>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => handleSettingChange('maintenance_mode', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Bakim Modunu Etkinlestir</div>
                    <div className="text-xs text-gray-500">Site ziyaretcilere bakim mesaji gosterir. Admin kullanicilari normal erismeye devam eder.</div>
                  </div>
                </label>

                {settings.maintenance_mode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakim Mesaji</label>
                    <textarea
                      value={settings.maintenance_message}
                      onChange={(e) => handleSettingChange('maintenance_message', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {settings.maintenance_mode && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Uyari: Bakim modu aktif!</span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Site su anda bakim modunda. Ziyaretciler bakim mesajini gorecek, sadece admin erisebilir.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-600">v2.1.0</div>
            <div className="text-sm text-gray-600">Sistem Versiyonu</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-600">Cevrimici</div>
            <div className="text-sm text-gray-600">Sistem Durumu</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-600">1</div>
            <div className="text-sm text-gray-600">Aktif Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
