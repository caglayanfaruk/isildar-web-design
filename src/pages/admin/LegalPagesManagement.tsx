import React, { useState, useEffect } from 'react';
import { Save, Edit, X, FileText, Shield, Eye, Globe } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LegalPage {
  privacy_policy: string;
  terms_of_service: string;
  kvkk_policy: string;
  cookie_policy: string;
  return_policy: string;
  shipping_policy: string;
}

const LegalPagesManagement = () => {
  const [legalPages, setLegalPages] = useState<LegalPage>({
    privacy_policy: '',
    terms_of_service: '',
    kvkk_policy: '',
    cookie_policy: '',
    return_policy: '',
    shipping_policy: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof LegalPage>('privacy_policy');
  const [currentLanguage, setCurrentLanguage] = useState('tr');

  useEffect(() => {
    loadLegalPages();
  }, [currentLanguage]);

  const loadLegalPages = async () => {
    try {
      // Load legal page translations
      const legalKeys = Object.keys(legalPages);
      const translationKeys = legalKeys.map(key => `legal.${key}`);

      const { data: translations, error } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', currentLanguage)
        .in('translation_key', translationKeys);

      if (error) throw error;

      if (translations && translations.length > 0) {
        const pagesObj: any = {};
        translations.forEach(translation => {
          const key = translation.translation_key.replace('legal.', '');
          pagesObj[key] = translation.translation_value;
        });
        setLegalPages({ ...legalPages, ...pagesObj });
      }
    } catch (error) {
      console.error('Error loading legal pages:', error);
      toast.error('Yasal sayfalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save translations for current language
      const translationPromises = Object.entries(legalPages).map(([key, value]) => {
        if (value.trim()) {
          return supabase
            .from('translations')
            .upsert({
              language_code: currentLanguage,
              translation_key: `legal.${key}`,
              translation_value: value,
              context: 'legal_pages'
            });
        }
        return Promise.resolve();
      });

      await Promise.all(translationPromises);

      toast.success('Yasal sayfalar kaydedildi');
    } catch (error) {
      console.error('Error saving legal pages:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (page: keyof LegalPage, value: string) => {
    setLegalPages(prev => ({
      ...prev,
      [page]: value
    }));
  };

  const legalPageTabs = [
    { 
      id: 'privacy_policy' as keyof LegalPage, 
      name: 'Gizlilik Politikası', 
      icon: Shield,
      description: 'Kişisel verilerin korunması ve gizlilik politikası'
    },
    { 
      id: 'terms_of_service' as keyof LegalPage, 
      name: 'Kullanım Şartları', 
      icon: FileText,
      description: 'Site kullanım şartları ve koşulları'
    },
    { 
      id: 'kvkk_policy' as keyof LegalPage, 
      name: 'KVKK Politikası', 
      icon: Shield,
      description: 'Kişisel Verilerin Korunması Kanunu uyum metni'
    },
    { 
      id: 'cookie_policy' as keyof LegalPage, 
      name: 'Çerez Politikası', 
      icon: FileText,
      description: 'Çerez kullanımı ve politikası'
    },
    { 
      id: 'return_policy' as keyof LegalPage, 
      name: 'İade Politikası', 
      icon: FileText,
      description: 'Ürün iade şartları ve koşulları'
    },
    { 
      id: 'shipping_policy' as keyof LegalPage, 
      name: 'Kargo Politikası', 
      icon: FileText,
      description: 'Kargo ve teslimat şartları'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Yasal Sayfalar</h1>
          <p className="text-gray-600 mt-1">Gizlilik politikası, KVKK ve diğer yasal metinleri yönetin</p>
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
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {legalPageTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
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

      {/* Content Editor */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {legalPageTabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Globe className="w-4 h-4" />
              <span>Dil: {currentLanguage.toUpperCase()}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {legalPageTabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={legalPages[activeTab]}
            onChange={(e) => handlePageChange(activeTab, e.target.value)}
            rows={20}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={`${legalPageTabs.find(tab => tab.id === activeTab)?.name} metnini buraya yazın...

Örnek yapı:

1. GİRİŞ
Bu politika, [Şirket Adı] tarafından işletilen web sitesinde...

2. VERİ TOPLAMA
Aşağıdaki kişisel verilerinizi toplayabiliriz:
- Ad ve soyad
- E-posta adresi
- Telefon numarası

3. VERİ KULLANIMI
Toplanan veriler aşağıdaki amaçlarla kullanılır:
- Hizmet sunumu
- Müşteri desteği
- Yasal yükümlülükler

4. VERİ GÜVENLİĞİ
Verilerinizin güvenliği için...

5. İLETİŞİM
Bu politika hakkında sorularınız için:
E-posta: info@isildar.eu
Telefon: +90 212 549 53 93`}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Karakter sayısı: {legalPages[activeTab].length}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  const currentPage = legalPageTabs.find(tab => tab.id === activeTab);
                  if (currentPage) {
                    window.open(`/legal/${activeTab}`, '_blank');
                  }
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Önizle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Şablon Önerileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">KVKK Politikası İçin</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Veri sorumlusu bilgileri</li>
              <li>• Toplanan kişisel veriler</li>
              <li>• Veri işleme amaçları</li>
              <li>• Veri saklama süreleri</li>
              <li>• Veri güvenliği önlemleri</li>
              <li>• Kişi hakları ve başvuru yolları</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Gizlilik Politikası İçin</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Hangi bilgilerin toplandığı</li>
              <li>• Bilgilerin nasıl kullanıldığı</li>
              <li>• Çerez politikası</li>
              <li>• Üçüncü taraf paylaşımları</li>
              <li>• Güvenlik önlemleri</li>
              <li>• İletişim bilgileri</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPagesManagement;