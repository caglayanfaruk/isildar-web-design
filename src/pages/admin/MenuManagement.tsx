import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Menu as MenuIcon, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Menu {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MenuItem {
  id: string;
  menu_id: string;
  parent_id?: string;
  title: string;
  url?: string;
  target: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: MenuItem[];
}

const MenuManagement = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'menus' | 'items'>('menus');
  const [formData, setFormData] = useState({
    name: '',
    location: 'header',
    is_active: true
  });
  const [itemFormData, setItemFormData] = useState({
    menu_id: '',
    parent_id: '',
    title: '',
    url: '',
    target: '_self',
    icon: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    if (selectedMenuId) {
      loadMenuItems();
    }
  }, [selectedMenuId]);

  const loadMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
      if (data && data.length > 0 && !selectedMenuId) {
        setSelectedMenuId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Menüler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', selectedMenuId)
        .order('sort_order');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('Menü öğeleri yüklenirken hata oluştu');
    }
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('menus')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Menü güncellendi');
      } else {
        const { error } = await supabase
          .from('menus')
          .insert([formData]);

        if (error) throw error;
        toast.success('Yeni menü eklendi');
      }

      resetForm();
      loadMenus();
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = { 
        ...itemFormData, 
        menu_id: selectedMenuId,
        parent_id: itemFormData.parent_id || null
      };
      
      if (editingId) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Menü öğesi güncellendi');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;
        toast.success('Yeni menü öğesi eklendi');
      }

      resetItemForm();
      loadMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleMenuEdit = (menu: Menu) => {
    setFormData({
      name: menu.name,
      location: menu.location,
      is_active: menu.is_active
    });
    setEditingId(menu.id);
    setShowAddForm(true);
    setActiveTab('menus');
  };

  const handleItemEdit = (item: MenuItem) => {
    setItemFormData({
      menu_id: item.menu_id,
      parent_id: item.parent_id || '',
      title: item.title,
      url: item.url || '',
      target: item.target,
      icon: item.icon || '',
      sort_order: item.sort_order,
      is_active: item.is_active
    });
    setEditingId(item.id);
    setShowAddForm(true);
    setActiveTab('items');
  };

  const handleMenuDelete = async (id: string) => {
    if (!confirm('Bu menüyü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Menü silindi');
      loadMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleItemDelete = async (id: string) => {
    if (!confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Menü öğesi silindi');
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, table: 'menus' | 'menu_items', isActive: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      
      if (table === 'menus') {
        loadMenus();
      } else {
        loadMenuItems();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentItem = menuItems.find(item => item.id === id);
      if (!currentItem) return;

      const newOrder = direction === 'up' ? currentItem.sort_order - 1 : currentItem.sort_order + 1;
      
      const { error } = await supabase
        .from('menu_items')
        .update({ sort_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      toast.success('Sıralama güncellendi');
      loadMenuItems();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: 'header',
      is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const resetItemForm = () => {
    setItemFormData({
      menu_id: selectedMenuId,
      parent_id: '',
      title: '',
      url: '',
      target: '_self',
      icon: '',
      sort_order: 0,
      is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
          <p className="text-gray-600 mt-1">Site menülerini yönetin</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'menus') {
              setShowAddForm(true);
            } else {
              setItemFormData({ ...itemFormData, menu_id: selectedMenuId });
              setShowAddForm(true);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'menus' ? 'Yeni Menü' : 'Yeni Öğe'} Ekle</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('menus')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menus'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Menüler
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Menü Öğeleri
          </button>
        </nav>
      </div>

      {/* Menu Selection for Items Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menü Seçin
          </label>
          <select
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name} ({menu.location})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add/Edit Forms */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId 
                ? (activeTab === 'menus' ? 'Menü Düzenle' : 'Menü Öğesi Düzenle')
                : (activeTab === 'menus' ? 'Yeni Menü Ekle' : 'Yeni Menü Öğesi Ekle')
              }
            </h2>
            <button
              onClick={() => {
                if (activeTab === 'menus') {
                  resetForm();
                } else {
                  resetItemForm();
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeTab === 'menus' ? (
            <form onSubmit={handleMenuSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Menü Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konum *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
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
          ) : (
            <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={itemFormData.title}
                  onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={itemFormData.url}
                  onChange={(e) => setItemFormData({ ...itemFormData, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/hakkimizda, https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üst Menü
                </label>
                <select
                  value={itemFormData.parent_id}
                  onChange={(e) => setItemFormData({ ...itemFormData, parent_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ana Menü</option>
                  {menuItems.filter(item => !item.parent_id).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Hedefi
                </label>
                <select
                  value={itemFormData.target}
                  onChange={(e) => setItemFormData({ ...itemFormData, target: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="_self">Aynı Pencere</option>
                  <option value="_blank">Yeni Pencere</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İkon
                </label>
                <input
                  type="text"
                  value={itemFormData.icon}
                  onChange={(e) => setItemFormData({ ...itemFormData, icon: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="home, user, settings..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıralama
                </label>
                <input
                  type="number"
                  value={itemFormData.sort_order}
                  onChange={(e) => setItemFormData({ ...itemFormData, sort_order: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={itemFormData.is_active}
                    onChange={(e) => setItemFormData({ ...itemFormData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetItemForm}
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
          )}
        </div>
      )}

      {/* Content Lists */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {activeTab === 'menus' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Menü Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MenuIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {menu.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {menu.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(menu.id, 'menus', menu.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          menu.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {menu.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {menu.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(menu.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleMenuEdit(menu)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMenuDelete(menu.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıralama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        <div className="text-sm font-medium text-gray-900">
                          {item.parent_id && <span className="text-gray-400 mr-2">└</span>}
                          {item.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.url || <span className="text-gray-400">URL yok</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{item.sort_order}</span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleReorder(item.id, 'up')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(item.id, 'down')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(item.id, 'menu_items', item.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {item.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleItemEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleItemDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;