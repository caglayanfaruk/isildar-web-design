import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Video, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';
import VideoUploadSelector from '../../components/admin/VideoUploadSelector';

interface VideoSection {
  id: string;
  video_url: string;
  thumbnail_image_id: string | null;
  duration: string;
  quality: string;
  subtitle_info: string;
  is_active: boolean;
  badge_tr?: string;
  title_tr?: string;
  description_tr?: string;
  video_title_tr?: string;
}

interface VideoFeature {
  id: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  title_tr?: string;
  description_tr?: string;
}

const HomepageVideoManagement = () => {
  const [videoSection, setVideoSection] = useState<VideoSection | null>(null);
  const [features, setFeatures] = useState<VideoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [showAddFeature, setShowAddFeature] = useState(false);

  const [videoFormData, setVideoFormData] = useState({
    video_url: '',
    thumbnail_image_id: null as string | null,
    duration: '3:45',
    quality: '4K Kalite',
    subtitle_info: 'Türkçe Altyazılı',
    is_active: true,
    badge_tr: '',
    title_tr: '',
    description_tr: '',
    video_title_tr: ''
  });

  const [featureFormData, setFeatureFormData] = useState({
    icon: 'Star',
    sort_order: 0,
    is_active: true,
    title_tr: '',
    description_tr: ''
  });

  useEffect(() => {
    loadVideoSection();
    loadFeatures();
  }, []);

  const loadVideoSection = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_video_section')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVideoSection(data);
        setVideoFormData({
          video_url: data.video_url || '',
          thumbnail_image_id: data.thumbnail_image_id,
          duration: data.duration,
          quality: data.quality,
          subtitle_info: data.subtitle_info,
          is_active: data.is_active,
          badge_tr: data.badge_tr || '',
          title_tr: data.title_tr || '',
          description_tr: data.description_tr || '',
          video_title_tr: data.video_title_tr || ''
        });
      }
    } catch (error) {
      console.error('Error loading video section:', error);
      toast.error('Video bölümü yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_video_features')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleSaveVideoSection = async () => {
    try {
      if (videoSection) {
        const { error } = await supabase
          .from('homepage_video_section')
          .update({
            ...videoFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', videoSection.id);

        if (error) throw error;
        toast.success('Video bölümü güncellendi');
      } else {
        const { error } = await supabase
          .from('homepage_video_section')
          .insert([videoFormData]);

        if (error) throw error;
        toast.success('Video bölümü oluşturuldu');
      }

      loadVideoSection();
    } catch (error) {
      console.error('Error saving video section:', error);
      toast.error('Kaydetme hatası');
    }
  };

  const handleSaveFeature = async (featureId?: string) => {
    try {
      if (featureId) {
        const { error } = await supabase
          .from('homepage_video_features')
          .update({
            ...featureFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', featureId);

        if (error) throw error;
        toast.success('Özellik güncellendi');
        setEditingFeatureId(null);
      } else {
        const { error } = await supabase
          .from('homepage_video_features')
          .insert([featureFormData]);

        if (error) throw error;
        toast.success('Özellik eklendi');
        setShowAddFeature(false);
      }

      loadFeatures();
      resetFeatureForm();
    } catch (error) {
      console.error('Error saving feature:', error);
      toast.error('Kaydetme hatası');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('Bu özelliği silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('homepage_video_features')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Özellik silindi');
      loadFeatures();
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Silme hatası');
    }
  };

  const startEditFeature = (feature: VideoFeature) => {
    setFeatureFormData({
      icon: feature.icon,
      sort_order: feature.sort_order,
      is_active: feature.is_active,
      title_tr: feature.title_tr || '',
      description_tr: feature.description_tr || ''
    });
    setEditingFeatureId(feature.id);
  };

  const resetFeatureForm = () => {
    setFeatureFormData({
      icon: 'Star',
      sort_order: features.length,
      is_active: true,
      title_tr: '',
      description_tr: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anasayfa Video Bölümü</h1>
          <p className="text-gray-600 mt-1">Video bölümünü ve özelliklerini yönetin</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Video className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Video Ayarları</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video
            </label>
            <VideoUploadSelector
              selectedVideoUrl={videoFormData.video_url}
              onVideoSelect={(url) => setVideoFormData({ ...videoFormData, video_url: url })}
              onVideoRemove={() => setVideoFormData({ ...videoFormData, video_url: '' })}
            />
            <p className="text-xs text-gray-500 mt-2">
              Video dosyası yükleyin veya manuel olarak URL girin
            </p>
            <input
              type="text"
              value={videoFormData.video_url}
              onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
              placeholder="Veya video URL'i girin..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Görseli
            </label>
            <ImageUploadSelector
              value={videoFormData.thumbnail_image_id || ''}
              onChange={(mediaId, url) => setVideoFormData({ ...videoFormData, thumbnail_image_id: mediaId })}
              label="Thumbnail Görseli"
              folder="videos"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-3">Türkçe İçerikler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge (Küçük Etiket)
                </label>
                <input
                  type="text"
                  value={videoFormData.badge_tr}
                  onChange={(e) => setVideoFormData({ ...videoFormData, badge_tr: e.target.value })}
                  placeholder="Kurumsal Tanıtım"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={videoFormData.title_tr}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title_tr: e.target.value })}
                  placeholder="Işıldar LED Aydınlatma"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={videoFormData.description_tr}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description_tr: e.target.value })}
                  placeholder="Modern LED teknolojisi ve üretim süreçlerimizi keşfedin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Başlığı (Oynatıcıda görünen)
                </label>
                <input
                  type="text"
                  value={videoFormData.video_title_tr}
                  onChange={(e) => setVideoFormData({ ...videoFormData, video_title_tr: e.target.value })}
                  placeholder="Üretim Sürecimiz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ℹ️ Kaydettiğinizde otomatik olarak İngilizce, Almanca, Fransızca, Arapça ve Rusça'ya çevrilecektir.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Süre
              </label>
              <input
                type="text"
                value={videoFormData.duration}
                onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                placeholder="3:45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kalite
              </label>
              <input
                type="text"
                value={videoFormData.quality}
                onChange={(e) => setVideoFormData({ ...videoFormData, quality: e.target.value })}
                placeholder="4K Kalite"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altyazı Bilgisi
              </label>
              <input
                type="text"
                value={videoFormData.subtitle_info}
                onChange={(e) => setVideoFormData({ ...videoFormData, subtitle_info: e.target.value })}
                placeholder="Türkçe Altyazılı"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={videoFormData.is_active}
              onChange={(e) => setVideoFormData({ ...videoFormData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Aktif
            </label>
          </div>

          <button
            onClick={handleSaveVideoSection}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Star className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Video Özellikleri</h2>
          </div>
          <button
            onClick={() => {
              resetFeatureForm();
              setShowAddFeature(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Özellik Ekle</span>
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Çeviri anahtarları: <code className="bg-gray-100 px-2 py-1 rounded">homepage.video.feature.{'{feature_id}'}.title</code> ve <code className="bg-gray-100 px-2 py-1 rounded">homepage.video.feature.{'{feature_id}'}.description</code></p>
        </div>

        {showAddFeature && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Yeni Özellik</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Türkçe İçerikler</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={featureFormData.title_tr}
                    onChange={(e) => setFeatureFormData({ ...featureFormData, title_tr: e.target.value })}
                    placeholder="Modern Üretim"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={featureFormData.description_tr}
                    onChange={(e) => setFeatureFormData({ ...featureFormData, description_tr: e.target.value })}
                    placeholder="Son teknoloji üretim tesislerimiz"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Lucide)
                </label>
                <input
                  type="text"
                  value={featureFormData.icon}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, icon: e.target.value })}
                  placeholder="Factory, Lightbulb, Globe..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sıra
                </label>
                <input
                  type="number"
                  value={featureFormData.sort_order}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, sort_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={featureFormData.is_active}
                    onChange={(e) => setFeatureFormData({ ...featureFormData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSaveFeature()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
              <button
                onClick={() => {
                  setShowAddFeature(false);
                  resetFeatureForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>İptal</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {editingFeatureId === feature.id ? (
                <div className="flex-1 space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Başlık (TR)</label>
                        <input
                          type="text"
                          value={featureFormData.title_tr}
                          onChange={(e) => setFeatureFormData({ ...featureFormData, title_tr: e.target.value })}
                          placeholder="Başlık"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama (TR)</label>
                        <input
                          type="text"
                          value={featureFormData.description_tr}
                          onChange={(e) => setFeatureFormData({ ...featureFormData, description_tr: e.target.value })}
                          placeholder="Açıklama"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={featureFormData.icon}
                      onChange={(e) => setFeatureFormData({ ...featureFormData, icon: e.target.value })}
                      placeholder="Icon"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      value={featureFormData.sort_order}
                      onChange={(e) => setFeatureFormData({ ...featureFormData, sort_order: parseInt(e.target.value) })}
                      placeholder="Sıra"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={featureFormData.is_active}
                        onChange={(e) => setFeatureFormData({ ...featureFormData, is_active: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{feature.title_tr || feature.icon}</span>
                    <span className="text-sm text-gray-600">Icon: {feature.icon}</span>
                    <span className="text-sm text-gray-600">Sıra: {feature.sort_order}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {feature.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {feature.description_tr || 'Açıklama girilmemiş'}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {editingFeatureId === feature.id ? (
                  <>
                    <button
                      onClick={() => handleSaveFeature(feature.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingFeatureId(null);
                        resetFeatureForm();
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditFeature(feature)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomepageVideoManagement;
