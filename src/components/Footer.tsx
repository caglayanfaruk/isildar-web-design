import React, { useEffect, useState } from 'react';
import { Lightbulb, Phone, Mail, MapPin, Fan as Fax, Facebook, Twitter, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Settings {
  contact_phone?: string;
  contact_email?: string;
  contact_fax?: string;
  contact_address?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  company_description?: string;
  copyright_text?: string;
}

const Footer = () => {
  const { currentLanguage, t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, [currentLanguage]);

  const fetchCategories = async () => {
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, slug')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(8);

    if (categoriesData) {
      // Her kategori için translation'ı çek (seçili dilde)
      const categoriesWithNames = await Promise.all(
        categoriesData.map(async (cat) => {
          const { data: translation } = await supabase
            .from('translations')
            .select('translation_value')
            .eq('language_code', currentLanguage)
            .eq('translation_key', `category.${cat.slug}.name`)
            .maybeSingle();

          return {
            id: cat.id,
            slug: cat.slug,
            name: translation?.translation_value || cat.slug
          };
        })
      );
      setCategories(categoriesWithNames);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'contact_phone', 'contact_email', 'contact_fax', 'contact_address',
        'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
        'company_description', 'copyright_text'
      ]);

    if (data) {
      const settingsObj: Settings = {};
      data.forEach(item => {
        try {
          settingsObj[item.key as keyof Settings] = JSON.parse(item.value).replace(/"/g, '');
        } catch {
          settingsObj[item.key as keyof Settings] = item.value;
        }
      });
      setSettings(settingsObj);
    }
  };

  const socialLinks = [
    { Icon: Facebook, url: settings.facebook_url },
    { Icon: Twitter, url: settings.twitter_url },
    { Icon: Instagram, url: settings.instagram_url },
    { Icon: Linkedin, url: settings.linkedin_url }
  ].filter(link => link.url);

  return (
    <footer className="bg-gradient-to-br from-black via-gray-900 to-black text-white border-t border-white/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-xl p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-white/20">
                  <Lightbulb className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:tracking-wider transition-all duration-300">IŞILDAR</h3>
                <p className="text-gray-400 text-sm">Aydınlatma Teknolojileri</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {settings.company_description ||
                '1972 yılından bu yana aydınlatma sektöründe 53 yıllık deneyimi ile Türkiye\'nin önde gelen üretici firmalarından biri. Kaliteli ürünler üretip 47 ülkeye ihracat yapıyoruz.'}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex space-x-3">
                {socialLinks.map(({ Icon, url }, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/5 backdrop-blur-xl p-3 rounded-xl hover:bg-white hover:text-black transition-all duration-500 hover:scale-110 hover:rotate-12 border border-white/10 hover:border-white/30"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t('ui.footer.quick_links', 'Hızlı Linkler')}</h4>
            <ul className="space-y-2.5">
              {[
                { name: t('header.home', 'Ana Sayfa'), href: '/' },
                { name: t('header.products', 'Ürünler'), href: '/urunler' },
                { name: 'Blog', href: '/blog' },
                { name: t('header.news', 'Haberler'), href: '/haberler' },
                { name: t('header.about', 'Hakkımızda'), href: '/hakkimizda' },
                { name: t('header.quote', 'Teklif Al'), href: '/teklif' },
                { name: t('header.contact', 'İletişim'), href: '/iletisim' }
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center space-x-2.5 group hover:translate-x-1"
                  >
                    <div className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-white transition-all duration-300 flex-shrink-0"></div>
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t('header.products', 'Ürünler')}</h4>
            <ul className="space-y-2.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/kategori/${category.slug}`}
                    className="text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center space-x-2.5 group hover:translate-x-1"
                  >
                    <div className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-white transition-all duration-300 flex-shrink-0"></div>
                    <span>{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t('ui.footer.contact', 'İletişim')}</h4>
            <div className="space-y-4">
              {settings.contact_address && (
                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0 group-hover:text-white transition-colors duration-300" />
                    <div>
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300 leading-relaxed whitespace-pre-line">
                        {settings.contact_address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {settings.contact_phone && (
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <Phone className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                      {settings.contact_phone}
                    </span>
                  </a>
                )}
                {settings.contact_fax && (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                    <Fax className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                      {settings.contact_fax}
                    </span>
                  </div>
                )}
                {settings.contact_email && (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                      {settings.contact_email}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            {settings.copyright_text || `\u00A9 2025 IŞILDAR Aydınlatma Teknolojileri. ${t('ui.footer.all_rights', 'Tüm hakları saklıdır.')}`}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {[
              { name: 'Gizlilik Politikası', path: '/gizlilik-politikasi' },
              { name: 'Kullanım Şartları', path: '/kullanim-sartlari' },
              { name: 'KVKK', path: '/kvkk' }
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-1 group"
              >
                <span>{link.name}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;