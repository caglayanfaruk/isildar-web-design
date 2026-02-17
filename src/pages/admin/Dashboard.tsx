import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FileText,
  MessageSquare,
  TrendingUp,
  Mail,
  Calendar,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Newspaper,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Eye,
  PhoneCall,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBlogPosts: number;
  totalNews: number;
  pendingContactMessages: number;
  pendingQuoteRequests: number;
  totalContactMessages: number;
  totalQuoteRequests: number;
  newsletterSubscribers: number;
  recentProductsCount: number;
  publishedBlogPosts: number;
}

interface RecentActivity {
  id: string;
  type: 'product' | 'message' | 'quote' | 'blog' | 'news' | 'category';
  action: string;
  title: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: string;
  created_at: string;
}

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  company?: string;
  project_name?: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalBlogPosts: 0,
    totalNews: 0,
    pendingContactMessages: 0,
    pendingQuoteRequests: 0,
    totalContactMessages: 0,
    totalQuoteRequests: 0,
    newsletterSubscribers: 0,
    recentProductsCount: 0,
    publishedBlogPosts: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const startOfThisMonth = startOfMonth(new Date()).toISOString();

      const [
        productsResult,
        categoriesResult,
        blogResult,
        newsResult,
        contactResult,
        quoteResult,
        newsletterResult,
        recentProductsResult,
        publishedBlogResult,
        pendingContactResult,
        pendingQuoteResult,
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('categories').select('id', { count: 'exact' }),
        supabase.from('blog_posts').select('id', { count: 'exact' }),
        supabase.from('news').select('id', { count: 'exact' }),
        supabase.from('contact_messages').select('id', { count: 'exact' }),
        supabase.from('quote_requests').select('id', { count: 'exact' }),
        supabase.from('newsletter_subscriptions').select('id', { count: 'exact' }),
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .gte('created_at', startOfThisMonth),
        supabase
          .from('blog_posts')
          .select('id', { count: 'exact' })
          .eq('status', 'published'),
        supabase
          .from('contact_messages')
          .select('id', { count: 'exact' })
          .eq('status', 'unread'),
        supabase
          .from('quote_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
      ]);

      setStats({
        totalProducts: productsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalBlogPosts: blogResult.count || 0,
        totalNews: newsResult.count || 0,
        totalContactMessages: contactResult.count || 0,
        totalQuoteRequests: quoteResult.count || 0,
        newsletterSubscribers: newsletterResult.count || 0,
        recentProductsCount: recentProductsResult.count || 0,
        publishedBlogPosts: publishedBlogResult.count || 0,
        pendingContactMessages: pendingContactResult.count || 0,
        pendingQuoteRequests: pendingQuoteResult.count || 0,
      });

      await Promise.all([
        loadRecentActivities(),
        loadRecentMessages(),
        loadRecentQuotes(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];

      const [productsRes, messagesRes, quotesRes, blogRes, newsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, sku, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('contact_messages')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('quote_requests')
          .select('id, name, project_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('blog_posts')
          .select('id, created_at, blog_translations!inner(title)')
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('news')
          .select('id, created_at, news_translations!inner(title)')
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      if (productsRes.data) {
        // Ürün isimlerini translations'dan al
        for (const p of productsRes.data) {
          const { data: nameTranslation } = await supabase
            .from('translations')
            .select('translation_value')
            .eq('translation_key', `product.${p.id}.name`)
            .eq('language_code', 'tr')
            .maybeSingle();

          activities.push({
            id: p.id,
            type: 'product',
            action: 'Yeni ürün eklendi',
            title: nameTranslation?.translation_value || p.sku || 'Ürün',
            created_at: p.created_at,
          });
        }
      }

      if (messagesRes.data) {
        messagesRes.data.forEach((m: any) => {
          activities.push({
            id: m.id,
            type: 'message',
            action: 'İletişim mesajı alındı',
            title: m.name,
            created_at: m.created_at,
          });
        });
      }

      if (quotesRes.data) {
        quotesRes.data.forEach((q: any) => {
          activities.push({
            id: q.id,
            type: 'quote',
            action: 'Teklif talebi alındı',
            title: q.project_name || q.name,
            created_at: q.created_at,
          });
        });
      }

      if (blogRes.data) {
        blogRes.data.forEach((b: any) => {
          activities.push({
            id: b.id,
            type: 'blog',
            action: 'Blog yazısı eklendi',
            title: b.blog_translations?.[0]?.title || 'Blog',
            created_at: b.created_at,
          });
        });
      }

      if (newsRes.data) {
        newsRes.data.forEach((n: any) => {
          activities.push({
            id: n.id,
            type: 'news',
            action: 'Haber eklendi',
            title: n.news_translations?.[0]?.title || 'Haber',
            created_at: n.created_at,
          });
        });
      }

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivities(activities.slice(0, 6));
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const { data } = await supabase
        .from('contact_messages')
        .select('id, name, email, subject, message, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentMessages(data);
      }
    } catch (error) {
      console.error('Error loading recent messages:', error);
    }
  };

  const loadRecentQuotes = async () => {
    try {
      const { data } = await supabase
        .from('quote_requests')
        .select('id, name, email, company, project_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentQuotes(data);
      }
    } catch (error) {
      console.error('Error loading recent quotes:', error);
    }
  };

  const statCards = [
    {
      title: 'Ürünler',
      value: stats.totalProducts,
      change: stats.recentProductsCount,
      changeLabel: 'bu ay',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/admin/products',
    },
    {
      title: 'Kategoriler',
      value: stats.totalCategories,
      icon: Layers,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/admin/categories',
    },
    {
      title: 'Blog',
      value: stats.totalBlogPosts,
      change: stats.publishedBlogPosts,
      changeLabel: 'yayında',
      icon: FileText,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      path: '/admin/blog',
    },
    {
      title: 'Haberler',
      value: stats.totalNews,
      icon: Newspaper,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/admin/news',
    },
    {
      title: 'Mesajlar',
      value: stats.totalContactMessages,
      change: stats.pendingContactMessages,
      changeLabel: 'bekliyor',
      icon: Mail,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      path: '/admin/contact-messages',
      alert: stats.pendingContactMessages > 0,
    },
    {
      title: 'Teklifler',
      value: stats.totalQuoteRequests,
      change: stats.pendingQuoteRequests,
      changeLabel: 'bekliyor',
      icon: MessageSquare,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/admin/quote-requests',
      alert: stats.pendingQuoteRequests > 0,
    },
  ];

  const quickActions = [
    {
      title: 'Yeni Ürün',
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      path: '/admin/products/new',
    },
    {
      title: 'Blog Yaz',
      icon: FileText,
      gradient: 'from-violet-500 to-violet-600',
      path: '/admin/blog',
    },
    {
      title: 'Haber Ekle',
      icon: Newspaper,
      gradient: 'from-orange-500 to-orange-600',
      path: '/admin/news',
    },
    {
      title: 'Kategori',
      icon: Layers,
      gradient: 'from-emerald-500 to-emerald-600',
      path: '/admin/categories',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product':
        return { icon: Package, color: 'bg-blue-100 text-blue-600' };
      case 'message':
        return { icon: Mail, color: 'bg-rose-100 text-rose-600' };
      case 'quote':
        return { icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600' };
      case 'blog':
        return { icon: FileText, color: 'bg-violet-100 text-violet-600' };
      case 'news':
        return { icon: Newspaper, color: 'bg-orange-100 text-orange-600' };
      default:
        return { icon: Activity, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}dk`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}s`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}g`;
    return format(date, 'd MMM', { locale: tr });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      unread: { label: 'Okunmadı', className: 'bg-blue-100 text-blue-700' },
      pending: { label: 'Bekliyor', className: 'bg-yellow-100 text-yellow-700' },
      read: { label: 'Okundu', className: 'bg-gray-100 text-gray-700' },
      replied: { label: 'Cevaplandı', className: 'bg-green-100 text-green-700' },
      closed: { label: 'Kapalı', className: 'bg-gray-100 text-gray-700' },
    };

    const config = statusConfig[status] || statusConfig.unread;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
        >
          <Activity className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(card.path)}
              className={`group relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border ${
                card.alert ? 'border-rose-200 ring-1 ring-rose-100' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                {card.alert && (
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.change !== undefined && (
                  <p className="text-xs text-gray-500 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {card.change} {card.changeLabel}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                Son Aktiviteler
              </h3>
            </div>

            <div className="space-y-2">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const { icon: Icon, color } = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg ${color} flex-shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-600 truncate">{activity.title}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Henüz aktivite yok</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                İletişim Mesajları
                {stats.pendingContactMessages > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                    {stats.pendingContactMessages}
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate('/admin/contact-messages')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Tümü
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => navigate('/admin/contact-messages')}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 flex-shrink-0">
                      <User className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{message.name}</p>
                        {getStatusBadge(message.status)}
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">{message.email}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {message.subject || message.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {getTimeAgo(message.created_at)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Mesaj bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-500" />
                Teklif Talepleri
                {stats.pendingQuoteRequests > 0 && (
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                    {stats.pendingQuoteRequests}
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate('/admin/quote-requests')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Tümü
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => navigate('/admin/quote-requests')}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="p-2 rounded-lg bg-cyan-50 flex-shrink-0">
                      <PhoneCall className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{quote.name}</p>
                        {getStatusBadge(quote.status)}
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">{quote.email}</p>
                      {quote.project_name && (
                        <p className="text-xs text-gray-500 truncate">
                          {quote.project_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {getTimeAgo(quote.created_at)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Teklif talebi bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Hızlı İşlemler
            </h3>

            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="w-full group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {action.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Sistem Durumu</h4>
            <div className="space-y-3">
              {[
                { label: 'Veritabanı', status: 'online' },
                { label: 'API', status: 'online' },
                { label: 'Storage', status: 'online' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-5 text-white">
            <Users className="w-8 h-8 mb-3 opacity-90" />
            <p className="text-sm opacity-90 mb-1">Newsletter Aboneleri</p>
            <p className="text-3xl font-bold">{stats.newsletterSubscribers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
