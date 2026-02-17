import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, BarChart3, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Stat {
  id: string;
  icon: string;
  number_value: string;
  sort_order: number;
  is_active: boolean;
}

interface Feature {
  id: string;
  sort_order: number;
  is_active: boolean;
}

const HomepageAboutManagement = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [showAddStat, setShowAddStat] = useState(false);
  const [showAddFeature, setShowAddFeature] = useState(false);

  const [statFormData, setStatFormData] = useState({
    icon: 'Award',
    number_value: '0',
    sort_order: 0,
    is_active: true
  });

  const [featureFormData, setFeatureFormData] = useState({
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadStats();
    loadFeatures();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_stats')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_about_features')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleSaveStat = async (statId?: string) => {
    try {
      if (statId) {
        const { error } = await supabase
          .from('homepage_stats')
          .update({
            ...statFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', statId);

        if (error) throw error;
        toast.success('İstatistik güncellendi');
        setEditingStatId(null);
      } else {
        const { error } = await supabase
          .from('homepage_stats')
          .insert([statFormData]);

        if (error) throw error;
        toast.success('İstatistik eklendi');
        setShowAddStat(false);
      }

      loadStats();
      resetStatForm();
    } catch (error) {
      console.error('Error saving stat:', error);
      toast.error('Kaydetme hatası');
    }
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm('Bu istatistiği silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('homepage_stats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('İstatistik silindi');
      loadStats();
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast.error('Silme hatası');
    }
  };

  const handleSaveFeature = async (featureId?: string) => {
    try {
      if (featureId) {
        const { error } = await supabase
          .from('homepage_about_features')
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
          .from('homepage_about_features')
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
        .from('homepage_about_features')
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

  const startEditStat = (stat: Stat) => {
    setStatFormData({
      icon: stat.icon,
      number_value: stat.number_value,
      sort_order: stat.sort_order,
      is_active: stat.is_active
    });
    setEditingStatId(stat.id);
  };

  const startEditFeature = (feature: Feature) => {
    setFeatureFormData({
      sort_order: feature.sort_order,
      is_active: feature.is_active
    });
    setEditingFeatureId(feature.id);
  };

  const resetStatForm = () => {
    setStatFormData({
      icon: 'Award',
      number_value: '0',
      sort_order: stats.length,
      is_active: true
    });
  };

  const resetFeatureForm = () => {
    setFeatureFormData({
      sort_order: features.length,
      is_active: true
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
          <h1 className="text-2xl font-bold text-gray-900">Anasayfa Hakkımızda Bölümü</h1>
          <p className="text-gray-600 mt-1">İstatistikler ve özellikleri yönetin</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">İstatistikler</h2>
          </div>
          <button
            onClick={() => {
              resetStatForm();
              setShowAddStat(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>İstatistik Ekle</span>
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Çeviri anahtarları: <code className="bg-gray-100 px-2 py-1 rounded">homepage.stats.{'{stat_id}'}.label</code> ve <code className="bg-gray-100 px-2 py-1 rounded">homepage.stats.{'{stat_id}'}.description</code></p>
        </div>

        {showAddStat && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Yeni İstatistik</h3>
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Lucide)
                </label>
                <input
                  type="text"
                  value={statFormData.icon}
                  onChange={(e) => setStatFormData({ ...statFormData, icon: e.target.value })}
                  placeholder="Award, Users, Clock..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Değer
                </label>
                <input
                  type="text"
                  value={statFormData.number_value}
                  onChange={(e) => setStatFormData({ ...statFormData, number_value: e.target.value })}
                  placeholder="53+, 5K+..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sıra
                </label>
                <input
                  type="number"
                  value={statFormData.sort_order}
                  onChange={(e) => setStatFormData({ ...statFormData, sort_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={statFormData.is_active}
                    onChange={(e) => setStatFormData({ ...statFormData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSaveStat()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
              <button
                onClick={() => {
                  setShowAddStat(false);
                  resetStatForm();
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
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {editingStatId === stat.id ? (
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={statFormData.icon}
                    onChange={(e) => setStatFormData({ ...statFormData, icon: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={statFormData.number_value}
                    onChange={(e) => setStatFormData({ ...statFormData, number_value: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    value={statFormData.sort_order}
                    onChange={(e) => setStatFormData({ ...statFormData, sort_order: parseInt(e.target.value) })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={statFormData.is_active}
                      onChange={(e) => setStatFormData({ ...statFormData, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{stat.icon}</span>
                    <span className="text-lg font-bold text-blue-600">{stat.number_value}</span>
                    <span className="text-sm text-gray-600">Sıra: {stat.sort_order}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stat.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {stat.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {stat.id}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {editingStatId === stat.id ? (
                  <>
                    <button
                      onClick={() => handleSaveStat(stat.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingStatId(null);
                        resetStatForm();
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditStat(stat)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStat(stat.id)}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <List className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Hakkımızda Özellikleri</h2>
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
          <p>Çeviri anahtarı: <code className="bg-gray-100 px-2 py-1 rounded">homepage.about.feature.{'{feature_id}'}.label</code></p>
          <p className="mt-1">Ana metin çevirileri: <code className="bg-gray-100 px-2 py-1 rounded">homepage.about.badge</code>, <code className="bg-gray-100 px-2 py-1 rounded">homepage.about.title</code>, <code className="bg-gray-100 px-2 py-1 rounded">homepage.about.subtitle</code>, <code className="bg-gray-100 px-2 py-1 rounded">homepage.about.paragraph_1-4</code></p>
        </div>

        {showAddFeature && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Yeni Özellik</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
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
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={featureFormData.sort_order}
                    onChange={(e) => setFeatureFormData({ ...featureFormData, sort_order: parseInt(e.target.value) })}
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
              ) : (
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Sıra: {feature.sort_order}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${feature.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {feature.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {feature.id}
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

export default HomepageAboutManagement;
