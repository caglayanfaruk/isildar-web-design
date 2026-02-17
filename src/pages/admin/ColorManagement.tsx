import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Palette, Eye } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  neutral: string;
  background: string;
  surface: string;
  text: string;
}

const ColorManagement = () => {
  const [colors, setColors] = useState<ColorScheme>({
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    neutral: '#6B7280',
    background: '#000000',
    surface: '#1F2937',
    text: '#FFFFFF'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'colors')
        .eq('is_public', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const colorSettings: any = {};
        data.forEach((setting: Setting) => {
          colorSettings[setting.key.replace('color_', '')] = setting.value;
        });
        setColors({ ...colors, ...colorSettings });
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('Renkler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorKey: keyof ColorScheme, value: string) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing color settings
      await supabase
        .from('settings')
        .delete()
        .eq('category', 'colors');

      // Insert new color settings
      const colorSettings = Object.entries(colors).map(([key, value]) => ({
        key: `color_${key}`,
        value: value,
        type: 'color',
        category: 'colors',
        description: `${key.charAt(0).toUpperCase() + key.slice(1)} color`,
        is_public: true
      }));

      const { error } = await supabase
        .from('settings')
        .insert(colorSettings);

      if (error) throw error;

      toast.success('Renk ayarları kaydedildi');
      
      // Apply colors to CSS variables
      applyColorsToCSS();
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const applyColorsToCSS = () => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  const resetToDefaults = () => {
    setColors({
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#6B7280',
      background: '#000000',
      surface: '#1F2937',
      text: '#FFFFFF'
    });
  };

  const colorGroups = [
    {
      title: 'Ana Renkler',
      colors: [
        { key: 'primary', label: 'Ana Renk', description: 'Marka ana rengi' },
        { key: 'secondary', label: 'İkincil Renk', description: 'Destekleyici renk' },
        { key: 'accent', label: 'Vurgu Rengi', description: 'Dikkat çekici renk' }
      ]
    },
    {
      title: 'Durum Renkleri',
      colors: [
        { key: 'success', label: 'Başarı', description: 'Başarılı işlemler' },
        { key: 'warning', label: 'Uyarı', description: 'Dikkat gerektiren durumlar' },
        { key: 'error', label: 'Hata', description: 'Hata durumları' }
      ]
    },
    {
      title: 'Temel Renkler',
      colors: [
        { key: 'neutral', label: 'Nötr', description: 'Gri tonları' },
        { key: 'background', label: 'Arkaplan', description: 'Ana arkaplan rengi' },
        { key: 'surface', label: 'Yüzey', description: 'Kart ve panel rengi' },
        { key: 'text', label: 'Metin', description: 'Ana metin rengi' }
      ]
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
          <h1 className="text-2xl font-bold text-gray-900">Renk Yönetimi</h1>
          <p className="text-gray-600 mt-1">Site renk temasını yönetin</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Önizlemeyi Kapat' : 'Önizleme'}</span>
          </button>
          <button
            onClick={resetToDefaults}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Varsayılana Sıfırla
          </button>
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

      {/* Color Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {colorGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              {group.title}
            </h3>
            <div className="space-y-4">
              {group.colors.map((colorInfo) => (
                <div key={colorInfo.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {colorInfo.label}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={colors[colorInfo.key as keyof ColorScheme]}
                      onChange={(e) => handleColorChange(colorInfo.key as keyof ColorScheme, e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colors[colorInfo.key as keyof ColorScheme]}
                      onChange={(e) => handleColorChange(colorInfo.key as keyof ColorScheme, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500">{colorInfo.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Section */}
      {previewMode && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Renk Önizlemesi</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="w-full h-16 rounded-lg border border-gray-300 mb-2"
                  style={{ backgroundColor: value }}
                ></div>
                <div className="text-sm font-medium text-gray-700 capitalize">{key}</div>
                <div className="text-xs text-gray-500 font-mono">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanım Örnekleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.primary, color: 'white' }}>
            <h4 className="font-semibold">Ana Renk</h4>
            <p className="text-sm opacity-90">Butonlar ve linkler</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.success, color: 'white' }}>
            <h4 className="font-semibold">Başarı</h4>
            <p className="text-sm opacity-90">Başarılı işlemler</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.warning, color: 'white' }}>
            <h4 className="font-semibold">Uyarı</h4>
            <p className="text-sm opacity-90">Dikkat mesajları</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.error, color: 'white' }}>
            <h4 className="font-semibold">Hata</h4>
            <p className="text-sm opacity-90">Hata mesajları</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, color: colors.text }}>
            <h4 className="font-semibold">Yüzey</h4>
            <p className="text-sm opacity-75">Kartlar ve paneller</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.background, color: colors.text }}>
            <h4 className="font-semibold">Arkaplan</h4>
            <p className="text-sm opacity-75">Ana arkaplan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorManagement;