import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail, Search, Globe, ChevronDown, MapPin, ArrowRight, CreditCard, FileText, DollarSign } from 'lucide-react';
import Logo from './Logo';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'product' | 'category';
  sku: string;
  slug?: string;
  name: string;
  categoryName?: string;
  categoryId?: string;
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState<string | null>(null);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);
  const { currentLanguage, setCurrentLanguage, languages: dbLanguages, t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = !!user;
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadQuickMenuDocuments();
  }, []);

  const loadQuickMenuDocuments = async () => {
    try {
      const { data: docs } = await supabase
        .from('quick_menu_documents')
        .select('type, file_id')
        .eq('is_active', true)
        .in('type', ['catalog', 'price_list']);

      if (docs && docs.length > 0) {
        const fileIds = docs.map(d => d.file_id).filter(Boolean);

        if (fileIds.length > 0) {
          const { data: mediaFiles } = await supabase
            .from('media')
            .select('id, url')
            .in('id', fileIds);

          if (mediaFiles) {
            const mediaMap = new Map(mediaFiles.map(m => [m.id, m.url]));

            for (const doc of docs) {
              const url = mediaMap.get(doc.file_id);
              if (url) {
                if (doc.type === 'catalog') setCatalogUrl(url);
                if (doc.type === 'price_list') setPriceListUrl(url);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading quick menu documents:', error);
    }
  };

  useEffect(() => {
    const searchAll = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase();
        const results: SearchResult[] = [];
        const addedIds = new Set<string>();

        const { data: translations } = await supabase
          .from('translations')
          .select('*')
          .eq('language_code', currentLanguage)
          .ilike('translation_value', `%${query}%`)
          .limit(30);

        if (translations) {
          for (const trans of translations) {
            if (trans.translation_key.startsWith('product.') && trans.translation_key.endsWith('.name')) {
              const productIdentifier = trans.translation_key.split('.')[1];

              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdentifier);

              let query = supabase
                .from('products')
                .select('id, sku, slug, category_id')
                .eq('status', 'active');

              if (isUUID) {
                query = query.eq('id', productIdentifier);
              } else {
                query = query.or(`sku.eq.${productIdentifier},sku.ilike.${productIdentifier}%`);
              }

              const { data: products } = await query.limit(5);

              if (products && products.length > 0) {
                for (const product of products) {
                  if (!addedIds.has(product.id)) {
                    let categoryName = undefined;
                    if (product.category_id) {
                      const { data: category } = await supabase
                        .from('categories')
                        .select('slug')
                        .eq('id', product.category_id)
                        .maybeSingle();

                      if (category?.slug) {
                        const { data: catTrans } = await supabase
                          .from('translations')
                          .select('translation_value')
                          .eq('language_code', currentLanguage)
                          .eq('translation_key', `category.${category.slug}.name`)
                          .maybeSingle();

                        if (catTrans) {
                          categoryName = catTrans.translation_value;
                        }
                      }
                    }

                    addedIds.add(product.id);
                    results.push({
                      id: product.id,
                      type: 'product',
                      sku: product.sku,
                      slug: product.slug || product.sku,
                      name: trans.translation_value,
                      categoryName,
                      categoryId: product.category_id
                    });
                  }
                }
              }
            } else if (trans.translation_key.startsWith('category.') && trans.translation_key.endsWith('.name')) {
              const categorySlug = trans.translation_key.split('.')[1];

              const { data: category } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', categorySlug)
                .eq('is_active', true)
                .maybeSingle();

              if (category && !addedIds.has(category.id)) {
                addedIds.add(category.id);
                results.push({
                  id: category.id,
                  type: 'category',
                  sku: categorySlug,
                  name: trans.translation_value
                });
              }
            }
          }
        }

        const { data: productsBySku } = await supabase
          .from('products')
          .select('id, sku, slug, category_id')
          .eq('status', 'active')
          .ilike('sku', `%${query}%`)
          .limit(10);

        if (productsBySku) {
          for (const product of productsBySku) {
            if (!addedIds.has(product.id)) {
              const { data: allTranslations } = await supabase
                .from('translations')
                .select('translation_key, translation_value')
                .eq('language_code', currentLanguage)
                .like('translation_key', 'product.%.name')
                .limit(200);

              let productName = product.sku;
              if (allTranslations) {
                for (const t of allTranslations) {
                  const skuFromKey = t.translation_key.split('.')[1];
                  if (product.sku.includes(skuFromKey) || skuFromKey.includes(product.sku.split('-')[0])) {
                    productName = t.translation_value;
                    break;
                  }
                }
              }

              addedIds.add(product.id);
              results.push({
                id: product.id,
                type: 'product',
                sku: product.sku,
                slug: product.slug || product.sku,
                name: productName,
                categoryId: product.category_id
              });
            }
          }
        }

        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchAll();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, currentLanguage]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'category') {
      navigate(`/kategori/${result.sku}`);
    } else {
      // Ürünler için doğru URL formatı: /urun/{slug}
      navigate(`/urun/${result.slug || result.sku}`);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewAllResults = () => {
    navigate(`/urunler?search=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const navItems = [
    { name: t('header.home', 'Ana Sayfa'), href: '/' },
    { name: t('header.about', 'Hakkımızda'), href: '/hakkimizda' },
    { name: t('header.products', 'Ürünler'), href: '/urunler' },
    { name: t('header.projects', 'Referanslar'), href: '/referanslar' },
    { name: t('header.quote', 'Teklif Al'), href: '/teklif' },
    { name: t('header.news', 'Haberler'), href: '/haberler' },
    { name: t('header.contact', 'İletişim'), href: '/iletisim' },
  ];

  const languageFlags: Record<string, string> = {
    'tr': '🇹🇷',
    'en': '🇺🇸',
    'de': '🇩🇪',
    'ru': '🇷🇺',
  };

  return (
    <header
      className={`fixed ${isAdmin ? 'top-8' : 'top-0'} left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'bg-black/95 backdrop-blur-2xl shadow-2xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      {/* Top Info Bar */}
      <div className={`border-b border-white/5 transition-all duration-500 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-10 text-xs">
            <div className="flex items-center space-x-8 text-gray-400">
              {/* Desktop - All info */}
              <div className="hidden md:flex items-center space-x-8">
                <div className="flex items-center space-x-2 hover:text-white transition-colors duration-300">
                  <Phone className="w-3 h-3" />
                  <span>+90 212 549 53 93</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-white transition-colors duration-300">
                  <Mail className="w-3 h-3" />
                  <span>info@isildar.eu</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-white transition-colors duration-300">
                  <MapPin className="w-3 h-3" />
                  <span>İkitelli OSB. Başakşehir, İstanbul</span>
                </div>
              </div>
              
              {/* Mobile - Only phone and email */}
              <div className="flex md:hidden items-center space-x-4">
                <div className="flex items-center space-x-2 hover:text-white transition-colors duration-300">
                  <Phone className="w-3 h-3" />
                  <span>+90 212 549 53 93</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-white transition-colors duration-300">
                  <Mail className="w-3 h-3" />
                  <span>info@isildar.eu</span>
                </div>
              </div>
            </div>
            {/* Action Buttons - Top Right */}
            <div className="hidden md:flex items-center space-x-2">
              {catalogUrl && (
                <a
                  href={catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 group"
                >
                  <FileText className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{t('header.catalog', 'Katalog')}</span>
                </a>
              )}
              {priceListUrl && (
                <a
                  href={priceListUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 group"
                >
                  <DollarSign className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{t('header.price_list', 'Fiyat Listesi')}</span>
                </a>
              )}
              <a
                href="https://isildaraspos.com/auth/sign-in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 group"
              >
                <CreditCard className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                <span>{t('header.online_payment', 'Online Ödeme')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo isScrolled={isScrolled} />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="relative text-white hover:text-gray-300 transition-all duration-300 font-medium text-sm group"
              >
                {item.name}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                <div className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 -z-10"></div>
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Quick Action Buttons - visible when scrolled */}
            {isScrolled && (
              <div className="flex items-center space-x-2 mr-2">
                {catalogUrl && (
                  <a
                    href={catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 group border border-emerald-400/20"
                  >
                    <FileText className="w-3.5 h-3.5 group-hover:rotate-6 transition-transform duration-300" />
                    <span>{t('header.catalog', 'Katalog')}</span>
                  </a>
                )}
                {priceListUrl && (
                  <a
                    href={priceListUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-600/90 to-amber-500/90 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30 group border border-amber-400/20"
                  >
                    <DollarSign className="w-3.5 h-3.5 group-hover:rotate-6 transition-transform duration-300" />
                    <span>{t('header.price_list', 'Fiyat Listesi')}</span>
                  </a>
                )}
                <a
                  href="https://isildaraspos.com/auth/sign-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-blue-600/90 to-blue-500/90 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 group border border-blue-400/20"
                >
                  <CreditCard className="w-3.5 h-3.5 group-hover:rotate-6 transition-transform duration-300" />
                  <span>{t('header.online_payment', 'Online Ödeme')}</span>
                </a>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="group p-3 rounded-xl bg-white/5 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300 hover:scale-110 border border-white/10 hover:border-white/30"
              >
                <Search className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-96 bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                  <div className="p-6">
                    <input
                      type="text"
                      placeholder="Ürün veya kategori ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 caret-white"
                      autoFocus
                    />
                  </div>

                  {isSearching && (
                    <div className="px-6 pb-6 text-center text-white/80">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="mt-2 text-sm">Aranıyor...</p>
                    </div>
                  )}

                  {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="px-6 pb-6 text-center text-white/70">
                      <p className="text-sm">Sonuç bulunamadı</p>
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="border-t border-white/10">
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full px-6 py-4 hover:bg-white/10 transition-all duration-300 text-left border-b border-white/5 last:border-0 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-white font-medium group-hover:text-gray-200 transition-colors">
                                    {result.name}
                                  </h4>
                                  {result.type === 'category' && (
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Kategori</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  {result.sku && (
                                    <span className="text-xs text-gray-400">SKU: {result.sku}</span>
                                  )}
                                  {result.categoryName && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-xs text-gray-400">{result.categoryName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleViewAllResults}
                        className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 group"
                      >
                        <span>Tüm Sonuçları Gör</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    </div>
                  )}

                  {searchQuery.length < 2 && (
                    <div className="px-6 pb-6 text-xs text-white/50">
                      Örnek: LED, Çerçeveler, Endüstriyel, Anahtar...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-2 p-3 rounded-xl bg-white/5 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300 hover:scale-110 border border-white/10 hover:border-white/30"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{currentLanguage.toUpperCase()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLanguageOpen && (
                <div className="absolute top-full right-0 mt-3 bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-300">
                  {dbLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      className="flex items-center space-x-3 w-full px-6 py-4 text-white hover:bg-white/10 transition-all duration-300 text-sm group"
                      onClick={() => {
                        setCurrentLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                        {languageFlags[lang.code] || '🌐'}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl bg-white/5 backdrop-blur-md text-white hover:bg-white/15 transition-all duration-300 hover:scale-110 border border-white/10"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/95 backdrop-blur-2xl border-t border-white/10 rounded-b-2xl animate-in slide-in-from-top duration-300">
            <nav className="py-6 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-6 py-3 text-white hover:bg-white/10 transition-all duration-300 rounded-lg mx-4 hover:translate-x-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Mobile Quick Actions */}
            <div className="px-4 pb-6 pt-2 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {catalogUrl && (
                  <a
                    href={catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium rounded-xl transition-all duration-300 active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t('header.catalog', 'Katalog')}</span>
                  </a>
                )}
                {priceListUrl && (
                  <a
                    href={priceListUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-medium rounded-xl transition-all duration-300 active:scale-95"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{t('header.price_list', 'Fiyat Listesi')}</span>
                  </a>
                )}
              </div>
              <a
                href="https://isildaraspos.com/auth/sign-in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl transition-all duration-300 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('header.online_payment', 'Online Ödeme')}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;