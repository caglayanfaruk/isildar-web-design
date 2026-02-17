import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Share2,
  ExternalLink,
  Newspaper,
  TrendingUp,
  Globe,
  Award,
  Users,
  Building,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';
import toast from 'react-hot-toast';

interface NewsItem {
  id: string;
  slug: string;
  status: string;
  urgent: boolean;
  external: boolean;
  source: string;
  views: number;
  published_at: string;
  created_at: string;
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

const NewsPage = () => {
  const { currentLanguage } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadNews();
  }, [currentLanguage]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Load translations for each news item
      const newsWithTranslations = await Promise.all(
        (data || []).map(async (newsItem) => {
          // Türkçe çevirileri al
          const { data: trTranslations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', 'tr')
            .in('translation_key', [
              `news.${newsItem.slug}.title`,
              `news.${newsItem.slug}.excerpt`,
              `news.${newsItem.slug}.content`
            ]);

          const trMap: any = {};
          trTranslations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            trMap[key] = t.translation_value || t.source_text;
          });

          // Seçili dile çevir
          const [translatedTitle, translatedExcerpt, translatedContent] = await Promise.all([
            translate(trMap.title || newsItem.slug, currentLanguage, `news.${newsItem.slug}.title`, { type: 'news' }),
            translate(trMap.excerpt || '', currentLanguage, `news.${newsItem.slug}.excerpt`, { type: 'news' }),
            translate(trMap.content || '', currentLanguage, `news.${newsItem.slug}.content`, { type: 'news' })
          ]);

          return {
            ...newsItem,
            translations: {
              title: translatedTitle,
              excerpt: translatedExcerpt,
              content: translatedContent
            }
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

  const filteredNews = news.filter(item => {
    const matchesSearch =
      item.translations?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.translations?.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const urgentNews = filteredNews.filter(item => item.urgent);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Haberler
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              IŞILDAR ve aydınlatma sektöründen son haberler, gelişmeler ve duyurular
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* Featured News */}
        {urgentNews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
              <span className="text-red-400">Öne Çıkan Haberler</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {urgentNews.slice(0, 2).map((newsItem) => (
                <article
                  key={newsItem.id}
                  className="group bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-xl rounded-2xl overflow-hidden border border-red-500/30 hover:border-red-400/50 transition-all duration-500 hover:scale-105 cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                      alt={newsItem.translations?.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        ÖNEMLİ
                      </span>
                    </div>
                    {newsItem.source && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="bg-white/20 backdrop-blur-xl text-white px-3 py-1 rounded-full text-xs border border-white/30">
                          {newsItem.source}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gray-100 transition-colors duration-300 line-clamp-2">
                      {newsItem.translations?.title || newsItem.slug}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                      {newsItem.translations?.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(newsItem.published_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className="w-3 h-3" />
                          <span>{newsItem.source}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{newsItem.views}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-32">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Haberlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">İstatistikler</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Toplam Haber</span>
                    <span className="text-sm font-bold text-white">{news.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Acil Haber</span>
                    <span className="text-sm font-bold text-red-400">{urgentNews.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Bu Ay</span>
                    <span className="text-sm font-bold text-blue-400">
                      {news.filter(n => {
                        const date = new Date(n.published_at);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredNews.length === 0 ? (
              <div className="text-center py-20">
                <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Henüz haber yok</h3>
                <p className="text-gray-500">Yakında yeni haberler eklenecek.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredNews.map((newsItem) => (
                  <article
                    key={newsItem.id}
                    className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:bg-gray-800/50 transition-all duration-500 cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row">
                      <div className="lg:w-80 h-48 lg:h-auto relative overflow-hidden flex-shrink-0">
                        <img
                          src="https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                          alt={newsItem.translations?.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 lg:bg-gradient-to-r lg:from-transparent lg:to-black/60" />

                        {newsItem.urgent && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>SON DAKİKA</span>
                            </span>
                          </div>
                        )}

                        {newsItem.source && (
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-white/20 backdrop-blur-xl text-white px-3 py-1 rounded-full text-xs border border-white/30">
                              {newsItem.source}
                            </span>
                          </div>
                        )}

                        {newsItem.external && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-black/50 backdrop-blur-xl p-2 rounded-full">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6 lg:p-8">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300 line-clamp-2 flex-1 mr-4">
                            {newsItem.translations?.title || newsItem.slug}
                          </h3>
                          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100">
                            <Share2 className="w-4 h-4 text-white" />
                          </button>
                        </div>

                        <p className="text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                          {newsItem.translations?.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(newsItem.published_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4" />
                              <span>{newsItem.source}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{newsItem.views}</span>
                            </div>
                          </div>

                          <button className="text-white font-medium hover:text-gray-300 transition-colors duration-300 flex items-center space-x-2 group">
                            <span>Devamını Oku</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <Newspaper className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Haber Bültenimize Abone Olun</h3>
            <p className="text-gray-300 mb-6">
              Aydınlatma sektöründen son haberler ve IŞILDAR güncellemelerini e-posta ile alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
              />
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105">
                Abone Ol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
