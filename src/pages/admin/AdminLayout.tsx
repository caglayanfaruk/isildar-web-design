import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { sidebarService, SidebarItem } from '../../services/sidebarService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface NotificationCounts {
  pendingMessages: number;
  pendingQuotes: number;
  total: number;
}

interface ViewAction {
  label: string;
  href: string;
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    pendingMessages: 0,
    pendingQuotes: 0,
    total: 0,
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewAction, setViewAction] = useState<ViewAction | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadSidebarItems();
    loadNotificationCounts();

    const interval = setInterval(loadNotificationCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    resolveViewAction();
  }, [location.pathname]);

  const resolveViewAction = async () => {
    setViewAction(null);

    const productMatch = location.pathname.match(/^\/admin\/products\/([a-f0-9-]+)$/);
    if (productMatch) {
      const { data } = await supabase
        .from('products')
        .select('slug, sku')
        .eq('id', productMatch[1])
        .maybeSingle();
      if (data) {
        setViewAction({ label: 'Urunu Goruntule', href: `/urun/${data.slug || data.sku}` });
      }
      return;
    }

    const categoryMatch = location.pathname.match(/^\/admin\/categories\/edit\/([a-f0-9-]+)$/);
    if (categoryMatch) {
      const { data } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', categoryMatch[1])
        .maybeSingle();
      if (data) {
        setViewAction({ label: 'Kategoriyi Goruntule', href: `/kategori/${data.slug}` });
      }
      return;
    }

    if (location.pathname === '/admin/news') {
      setViewAction({ label: 'Haberleri Goruntule', href: '/haberler' });
    } else if (location.pathname === '/admin/about') {
      setViewAction({ label: 'Hakkimizda Goruntule', href: '/hakkimizda' });
    } else if (location.pathname === '/admin/contact-info') {
      setViewAction({ label: 'Iletisim Goruntule', href: '/iletisim' });
    } else if (location.pathname === '/admin/products') {
      setViewAction({ label: 'Urunleri Goruntule', href: '/urunler' });
    } else if (location.pathname === '/admin/sliders') {
      setViewAction({ label: 'Ana Sayfayi Goruntule', href: '/' });
    }
  };

  const loadSidebarItems = async () => {
    try {
      setLoading(true);
      const items = await sidebarService.getSidebarItems();
      setMenuItems(items);

      const firstParentWithChildren = items.find(item => item.children && item.children.length > 0);
      if (firstParentWithChildren) {
        setExpandedMenus([firstParentWithChildren.id]);
      }
    } catch (error) {
      console.error('Error loading sidebar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCounts = async () => {
    try {
      const [messagesResult, quotesResult] = await Promise.all([
        supabase
          .from('contact_messages')
          .select('id', { count: 'exact' })
          .eq('status', 'unread'),
        supabase
          .from('quote_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
      ]);

      const pendingMessages = messagesResult.count || 0;
      const pendingQuotes = quotesResult.count || 0;

      setNotificationCounts({
        pendingMessages,
        pendingQuotes,
        total: pendingMessages + pendingQuotes,
      });
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (children: SidebarItem[]) => {
    return children.some(child => child.path && location.pathname === child.path);
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-gray-900 text-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">IŞILDAR Admin</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Icons.Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            menuItems.map((item) => {
              const IconComponent = getIconComponent(item.icon);
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.id);
              const isItemActive = item.path ? isActive(item.path) : (hasChildren && isParentActive(item.children));

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(item.id);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      isItemActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5" />
                      {sidebarOpen && <span className="font-medium">{item.title}</span>}
                    </div>
                    {sidebarOpen && hasChildren && (
                      <div className="transition-transform duration-200">
                        {isExpanded ? (
                          <Icons.ChevronDown className="w-4 h-4" />
                        ) : (
                          <Icons.ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Submenu */}
                  {hasChildren && isExpanded && sidebarOpen && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = getIconComponent(child.icon);
                        return (
                          <button
                            key={child.path || child.id}
                            onClick={() => child.path && navigate(child.path)}
                            className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm transition-all duration-200 ${
                              child.path && isActive(child.path)
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={async () => {
              try {
                await signOut();
                toast.success('Çıkış yapıldı');
                navigate('/admin/login');
              } catch (error) {
                toast.error('Çıkış yapılırken bir hata oluştu');
              }
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            <Icons.LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Çıkış Yap</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Admin Panel
              </h2>
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Icons.ExternalLink className="w-3.5 h-3.5" />
                  <span>Siteyi Goruntule</span>
                </a>
                {viewAction && (
                  <a
                    href={viewAction.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                    <span>{viewAction.label}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ara..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Icons.Bell className="w-5 h-5" />
                  {notificationCounts.total > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notificationCounts.total > 9 ? '9+' : notificationCounts.total}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
                        {notificationCounts.total > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            {notificationCounts.total} yeni
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notificationCounts.total === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <Icons.Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">Yeni bildirim yok</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notificationCounts.pendingMessages > 0 && (
                            <button
                              onClick={() => {
                                navigate('/admin/contact-messages');
                                setShowNotifications(false);
                              }}
                              className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                            >
                              <div className="p-2 bg-rose-100 rounded-lg flex-shrink-0">
                                <Icons.Mail className="w-5 h-5 text-rose-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  Yeni İletişim Mesajları
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {notificationCounts.pendingMessages} bekleyen mesaj
                                </p>
                              </div>
                              <Icons.ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                            </button>
                          )}

                          {notificationCounts.pendingQuotes > 0 && (
                            <button
                              onClick={() => {
                                navigate('/admin/quote-requests');
                                setShowNotifications(false);
                              }}
                              className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                            >
                              <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
                                <Icons.MessageSquare className="w-5 h-5 text-cyan-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  Yeni Teklif Talepleri
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {notificationCounts.pendingQuotes} bekleyen teklif
                                </p>
                              </div>
                              <Icons.ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {notificationCounts.total > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Tüm Bildirimleri Gör
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.[0].toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user?.email || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
