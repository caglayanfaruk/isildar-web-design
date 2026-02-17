import React, { useState, useEffect } from 'react';
import { Upload, Save, X, Image, Download, Trash2 } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface BrandingAssets {
  logo_light: string;
  logo_dark: string;
  favicon: string;
  logo_footer: string;
  logo_admin: string;
  logo_width: string;
  logo_height: string;
}

const BrandingManagement = () => {
  const [assets, setAssets] = useState<BrandingAssets>({
    logo_light: '',
    logo_dark: '',
    favicon: '',
    logo_footer: '',
    logo_admin: '',
    logo_width: '200',
    logo_height: '60'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadBrandingAssets();
  }, []);

  const loadBrandingAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'branding')
        .eq('is_public', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const brandingSettings: any = {};
        data.forEach((setting: Setting) => {
          const value = typeof setting.value === 'string' ? setting.value : JSON.parse(JSON.stringify(setting.value));
          brandingSettings[setting.key] = value.replace(/"/g, '');
        });
        setAssets({ ...assets, ...brandingSettings });
      }
    } catch (error) {
      console.error('Error loading branding assets:', error);
      toast.error('Marka varlıkları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, assetType: keyof BrandingAssets) => {
    if (!file) return;

    // Validate file type
    const validTypes = assetType === 'favicon' 
      ? ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];

    if (!validTypes.includes(file.type)) {
      toast.error('Geçersiz dosya türü');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploading(assetType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetType}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update assets state
      setAssets(prev => ({
        ...prev,
        [assetType]: publicUrl
      }));

      toast.success('Dosya başarıyla yüklendi');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Dosya yüklenirken hata oluştu');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing branding settings
      await supabase
        .from('settings')
        .delete()
        .eq('category', 'branding');

      // Insert new branding settings
      const brandingSettings = Object.entries(assets)
        .filter(([_, value]) => value)
        .map(([key, value]) => ({
          key: key,
          value: JSON.stringify(value),
          type: key.includes('width') || key.includes('height') ? 'text' : 'url',
          category: 'branding',
          description: `${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} URL`,
          is_public: true
        }));

      if (brandingSettings.length > 0) {
        const { error } = await supabase
          .from('settings')
          .insert(brandingSettings);

        if (error) throw error;
      }

      toast.success('Marka varlıkları kaydedildi');
    } catch (error) {
      console.error('Error saving branding assets:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAsset = (assetType: keyof BrandingAssets) => {
    setAssets(prev => ({
      ...prev,
      [assetType]: ''
    }));
  };

  const assetTypes = [
    {
      key: 'logo_light' as keyof BrandingAssets,
      title: 'Ana Logo (Açık Tema)',
      description: 'Beyaz/açık renkli arka planlar için logo',
      accept: 'image/*',
      recommended: 'PNG, SVG (Şeffaf arka plan önerilir)'
    },
    {
      key: 'logo_dark' as keyof BrandingAssets,
      title: 'Ana Logo (Koyu Tema)',
      description: 'Siyah/koyu renkli arka planlar için logo',
      accept: 'image/*',
      recommended: 'PNG, SVG (Şeffaf arka plan önerilir)'
    },
    {
      key: 'logo_footer' as keyof BrandingAssets,
      title: 'Footer Logo',
      description: 'Alt bilgi bölümünde kullanılacak logo',
      accept: 'image/*',
      recommended: 'PNG, SVG'
    },
    {
      key: 'logo_admin' as keyof BrandingAssets,
      title: 'Admin Panel Logo',
      description: 'Yönetim panelinde kullanılacak logo',
      accept: 'image/*',
      recommended: 'PNG, SVG'
    },
    {
      key: 'favicon' as keyof BrandingAssets,
      title: 'Favicon',
      description: 'Tarayıcı sekmesinde görünen küçük ikon',
      accept: '.ico,.png',
      recommended: 'ICO, PNG (32x32 veya 16x16 piksel)'
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
          <h1 className="text-2xl font-bold text-gray-900">Logo & Favicon Yönetimi</h1>
          <p className="text-gray-600 mt-1">Marka varlıklarınızı yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
        </button>
      </div>

      {/* Logo Size Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Boyutu Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genişlik (px)
            </label>
            <input
              type="number"
              value={assets.logo_width}
              onChange={(e) => setAssets(prev => ({ ...prev, logo_width: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="200"
              min="50"
              max="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yükseklik (px)
            </label>
            <input
              type="number"
              value={assets.logo_height}
              onChange={(e) => setAssets(prev => ({ ...prev, logo_height: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="60"
              min="30"
              max="200"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Logo boyutları header'da kullanılacaktır. Önerilen oran: 3:1 veya 4:1
        </p>
      </div>

      {/* Asset Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assetTypes.map((assetType) => (
          <div key={assetType.key} className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{assetType.title}</h3>
              {assets[assetType.key] && (
                <button
                  onClick={() => handleRemoveAsset(assetType.key)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{assetType.description}</p>
            
            {/* Current Asset Preview */}
            {assets[assetType.key] ? (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Mevcut Dosya:</span>
                  <a
                    href={assets[assetType.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>İndir</span>
                  </a>
                </div>
                <div className="flex items-center justify-center h-24 bg-white rounded border">
                  {assetType.key === 'favicon' ? (
                    <img
                      src={assets[assetType.key]}
                      alt={assetType.title}
                      className="max-h-8 max-w-8"
                    />
                  ) : (
                    <img
                      src={assets[assetType.key]}
                      alt={assetType.title}
                      className="max-h-20 max-w-full object-contain"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Henüz dosya yüklenmedi</p>
              </div>
            )}

            {/* Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading === assetType.key ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Dosya seçmek için tıklayın</span>
                        </p>
                        <p className="text-xs text-gray-500">{assetType.recommended}</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept={assetType.accept}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, assetType.key);
                      }
                    }}
                    disabled={uploading === assetType.key}
                  />
                </label>
              </div>
              
              <div className="text-xs text-gray-500">
                <strong>Önerilen:</strong> {assetType.recommended}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Guidelines */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanım Kılavuzu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Logo Önerileri</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Şeffaf arka plan kullanın (PNG/SVG)</li>
              <li>• Yüksek çözünürlük (en az 300x100px)</li>
              <li>• Vektör formatı tercih edin (SVG)</li>
              <li>• Koyu ve açık tema için ayrı versiyonlar</li>
              <li>• Dosya boyutu 1MB altında tutun</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Favicon Önerileri</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 32x32 veya 16x16 piksel boyutunda</li>
              <li>• ICO formatı tercih edin</li>
              <li>• PNG de desteklenir</li>
              <li>• Basit ve tanınabilir tasarım</li>
              <li>• Küçük boyutta net görünüm</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Önizleme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Theme Preview */}
          <div className="p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Açık Tema</h4>
            <div className="flex items-center justify-center h-20 bg-gray-50 rounded">
              {assets.logo_light ? (
                <img
                  src={assets.logo_light}
                  alt="Light Logo"
                  style={{
                    width: `${assets.logo_width}px`,
                    height: `${assets.logo_height}px`,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div className="text-gray-400 text-sm">Logo yüklenmedi</div>
              )}
            </div>
          </div>

          {/* Dark Theme Preview */}
          <div className="p-4 bg-gray-900 border rounded-lg">
            <h4 className="font-medium text-white mb-3">Koyu Tema</h4>
            <div className="flex items-center justify-center h-20 bg-gray-800 rounded">
              {assets.logo_dark ? (
                <img
                  src={assets.logo_dark}
                  alt="Dark Logo"
                  style={{
                    width: `${assets.logo_width}px`,
                    height: `${assets.logo_height}px`,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div className="text-gray-400 text-sm">Logo yüklenmedi</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingManagement;