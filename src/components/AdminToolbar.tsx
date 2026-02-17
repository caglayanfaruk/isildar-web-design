import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Pencil, LogOut, Package, Settings, Image, Newspaper } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EditAction {
  label: string;
  href: string;
}

const AdminToolbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [editAction, setEditAction] = useState<EditAction | null>(null);

  useEffect(() => {
    if (!user) return;
    resolveEditAction();
  }, [location.pathname, user]);

  const resolveEditAction = async () => {
    setEditAction(null);

    const productMatch = location.pathname.match(/^\/urun\/([^/]+)$/);
    if (productMatch && productMatch[1] !== 'variant') {
      const slug = decodeURIComponent(productMatch[1]);
      const { data } = await supabase
        .from('products')
        .select('id')
        .or(`slug.eq.${slug},sku.eq.${slug}`)
        .maybeSingle();
      if (data) {
        setEditAction({ label: 'Urunu Duzenle', href: `/admin/products/${data.id}` });
      }
      return;
    }

    const variantMatch = location.pathname.match(/^\/urun\/variant\/(.+)$/);
    if (variantMatch) {
      const code = decodeURIComponent(variantMatch[1]);
      const { data } = await supabase
        .from('variants')
        .select('product_id')
        .eq('sku', code)
        .maybeSingle();
      if (data) {
        setEditAction({ label: 'Urunu Duzenle', href: `/admin/products/${data.product_id}` });
      }
      return;
    }

    const categoryMatch = location.pathname.match(/^\/kategori\/(.+)$/);
    if (categoryMatch) {
      const slug = decodeURIComponent(categoryMatch[1]);
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (data) {
        setEditAction({ label: 'Kategoriyi Duzenle', href: `/admin/categories/edit/${data.id}` });
      }
      return;
    }

    if (location.pathname === '/') {
      setEditAction({ label: 'Ana Sayfa', href: '/admin/sliders' });
    }

    if (location.pathname === '/hakkimizda') {
      setEditAction({ label: 'Hakkimizda Duzenle', href: '/admin/about' });
    }

    if (location.pathname === '/iletisim') {
      setEditAction({ label: 'Iletisim Duzenle', href: '/admin/contact-info' });
    }

    if (location.pathname === '/haberler') {
      setEditAction({ label: 'Haberleri Duzenle', href: '/admin/news' });
    }
  };

  if (!user || location.pathname.startsWith('/admin')) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-[#1d2327] text-[#c3c4c7] text-[11px] font-medium select-none">
      <div className="h-full flex items-center justify-between px-3">
        <div className="flex items-center">
          <Link
            to="/admin"
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-white transition-colors duration-150"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panel</span>
          </Link>

          <Link
            to="/admin/products"
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-white transition-colors duration-150"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Urunler</span>
          </Link>

          <Link
            to="/admin/media"
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-white transition-colors duration-150"
          >
            <Image className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Medya</span>
          </Link>

          <Link
            to="/admin/news"
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-white transition-colors duration-150"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Haberler</span>
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-white transition-colors duration-150"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ayarlar</span>
          </Link>

          {editAction && (
            <Link
              to={editAction.href}
              className="flex items-center space-x-1.5 ml-1 px-3 h-6 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-sm transition-colors duration-150"
            >
              <Pencil className="w-3 h-3" />
              <span>{editAction.label}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center">
          <span className="text-[#c3c4c7] hidden md:inline truncate max-w-[180px] px-2">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-1.5 px-2.5 h-8 hover:bg-[#32373c] hover:text-[#d63638] transition-colors duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cikis Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminToolbar;
