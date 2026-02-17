import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Cookie } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

const LEGAL_PAGE_CONFIG: Record<string, { title_tr: string; title_en: string; key: string; icon: any }> = {
  'gizlilik-politikasi': {
    title_tr: 'Gizlilik Politikasi',
    title_en: 'Privacy Policy',
    key: 'privacy_policy',
    icon: Shield
  },
  'kullanim-sartlari': {
    title_tr: 'Kullanim Sartlari',
    title_en: 'Terms of Service',
    key: 'terms_of_service',
    icon: FileText
  },
  'kvkk': {
    title_tr: 'KVKK Politikasi',
    title_en: 'KVKK Policy',
    key: 'kvkk_policy',
    icon: Shield
  },
  'cerez-politikasi': {
    title_tr: 'Cerez Politikasi',
    title_en: 'Cookie Policy',
    key: 'cookie_policy',
    icon: Cookie
  }
};

const LegalPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace('/', '');
  const { currentLanguage } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const pageConfig = slug ? LEGAL_PAGE_CONFIG[slug] : null;

  useEffect(() => {
    if (pageConfig) {
      loadContent();
    }
  }, [slug, currentLanguage]);

  const loadContent = async () => {
    if (!pageConfig) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('translations')
        .select('translation_value')
        .eq('language_code', currentLanguage)
        .eq('translation_key', `legal.${pageConfig.key}`)
        .maybeSingle();

      if (data?.translation_value) {
        setContent(data.translation_value);
      } else {
        const { data: trData } = await supabase
          .from('translations')
          .select('translation_value')
          .eq('language_code', 'tr')
          .eq('translation_key', `legal.${pageConfig.key}`)
          .maybeSingle();
        setContent(trData?.translation_value || '');
      }
    } catch (error) {
      console.error('Error loading legal page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!pageConfig) {
    return (
      <div className="min-h-screen bg-black text-white pt-44 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sayfa Bulunamadi</h1>
          <Link to="/" className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            Ana Sayfaya Don
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = pageConfig.icon;
  const title = currentLanguage === 'tr' ? pageConfig.title_tr : pageConfig.title_en;

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="container mx-auto px-6 relative">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Ana Sayfa</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">{title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : content ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12">
              <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white whitespace-pre-wrap text-gray-300 leading-relaxed">
                {content}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-12">
              <IconComponent className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Bu sayfa icin henuz icerik eklenmemis.</p>
              <p className="text-gray-600 text-sm mt-2">Lutfen daha sonra tekrar kontrol edin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalPage;
