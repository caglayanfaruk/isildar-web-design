import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Save, Trash2, Download, Upload, Globe, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Translation {
  id: string;
  translation_key: string;
  language_code: string;
  translation_value: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

interface Language {
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
}

interface GroupedTranslations {
  [key: string]: {
    [lang: string]: Translation;
  };
}

const TranslationManagement = () => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValues, setNewValues] = useState<{ [lang: string]: string }>({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let allTranslations: Translation[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('translations')
          .select('*')
          .order('translation_key')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('Error loading translations:', error);
          toast.error('Çeviriler yüklenirken hata oluştu');
          break;
        }

        if (data && data.length > 0) {
          allTranslations = [...allTranslations, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      const { data: languagesData } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      setTranslations(allTranslations);
      if (languagesData) setLanguages(languagesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const groupTranslations = (): GroupedTranslations => {
    const grouped: GroupedTranslations = {};

    translations.forEach(translation => {
      if (!grouped[translation.translation_key]) {
        grouped[translation.translation_key] = {};
      }
      grouped[translation.translation_key][translation.language_code] = translation;
    });

    return grouped;
  };

  const getCategories = () => {
    const categories = new Set<string>();
    translations.forEach(t => {
      const parts = t.translation_key.split('.');
      if (parts.length > 0) {
        categories.add(parts[0]);
      }
    });
    return Array.from(categories).sort();
  };

  const filterTranslations = () => {
    const grouped = groupTranslations();
    let keys = Object.keys(grouped);

    if (searchTerm) {
      keys = keys.filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(grouped[key]).some(t =>
          t.translation_value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      keys = keys.filter(key => key.startsWith(selectedCategory + '.'));
    }

    return keys.map(key => ({ key, translations: grouped[key] }));
  };

  const startEdit = (key: string, translations: { [lang: string]: Translation }) => {
    setEditingKey(key);
    const values: { [key: string]: string } = {};
    Object.entries(translations).forEach(([lang, translation]) => {
      values[lang] = translation.translation_value;
    });
    setEditValues(values);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValues({});
  };

  const saveEdit = async (key: string) => {
    try {
      const updates = Object.entries(editValues).map(([lang, value]) => ({
        translation_key: key,
        language_code: lang,
        translation_value: value,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        await supabase
          .from('translations')
          .update({
            translation_value: update.translation_value,
            updated_at: update.updated_at
          })
          .eq('translation_key', update.translation_key)
          .eq('language_code', update.language_code);
      }

      toast.success('Çeviriler güncellendi');
      setEditingKey(null);
      setEditValues({});
      loadData();
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('Kayıt sırasında hata oluştu');
    }
  };

  const deleteTranslation = async (key: string) => {
    if (!confirm(`"${key}" anahtarını ve tüm çevirilerini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await supabase
        .from('translations')
        .delete()
        .eq('translation_key', key);

      toast.success('Çeviri silindi');
      loadData();
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const addNewTranslation = async () => {
    if (!newKey.trim()) {
      toast.error('Lütfen bir anahtar girin');
      return;
    }

    const existing = translations.find(t => t.translation_key === newKey);
    if (existing) {
      toast.error('Bu anahtar zaten mevcut');
      return;
    }

    try {
      const inserts = languages.map(lang => ({
        translation_key: newKey,
        language_code: lang.code,
        translation_value: newValues[lang.code] || newKey,
        context: ''
      }));

      const { error } = await supabase
        .from('translations')
        .insert(inserts);

      if (error) throw error;

      toast.success('Yeni çeviri eklendi');
      setNewKey('');
      setNewValues({});
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Error adding translation:', error);
      toast.error('Ekleme sırasında hata oluştu');
    }
  };

  const autoTranslateKey = async (key: string, sourceLang: string = 'tr') => {
    const sourceTranslation = translations.find(
      t => t.translation_key === key && t.language_code === sourceLang
    );

    if (!sourceTranslation) {
      toast.error('Kaynak çeviri bulunamadı');
      return;
    }

    setIsTranslating(true);
    try {
      const targetLanguages = languages
        .filter(l => l.code !== sourceLang)
        .map(l => l.code);

      for (const targetLang of targetLanguages) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              text: sourceTranslation.translation_value,
              targetLanguage: targetLang,
              sourceLanguage: sourceLang
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.translations) {
            await supabase
              .from('translations')
              .update({
                translation_value: data.translations.translatedText,
                updated_at: new Date().toISOString()
              })
              .eq('translation_key', key)
              .eq('language_code', targetLang);
          }
        }
      }

      toast.success('Otomatik çeviri tamamlandı');
      loadData();
    } catch (error) {
      console.error('Error auto-translating:', error);
      toast.error('Çeviri sırasında hata oluştu');
    } finally {
      setIsTranslating(false);
    }
  };

  const exportTranslations = () => {
    const csv = [
      ['Key', ...languages.map(l => l.code)].join(','),
      ...Object.entries(groupTranslations()).map(([key, translations]) => {
        return [
          key,
          ...languages.map(l => `"${(translations[l.code]?.translation_value || '').replace(/"/g, '""')}"`)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `translations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredData = filterTranslations();
  const categories = getCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çeviri Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Toplam {Object.keys(groupTranslations()).length} anahtar, {translations.length} çeviri
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportTranslations}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Dışa Aktar
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
          <h3 className="font-semibold mb-3">Yeni Çeviri Ekle</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anahtar (Key)
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="ui.example.key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {languages.map(lang => (
              <div key={lang.code}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang.name} ({lang.code.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={newValues[lang.code] || ''}
                  onChange={(e) => setNewValues({ ...newValues, [lang.code]: e.target.value })}
                  placeholder={`${lang.name} çevirisi`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addNewTranslation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewKey('');
                  setNewValues({});
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Anahtar veya çeviri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">Tüm Diller</option>
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anahtar
                </th>
                {languages
                  .filter(l => selectedLanguage === 'all' || l.code === selectedLanguage)
                  .map(lang => (
                    <th key={lang.code} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang.name}
                    </th>
                  ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(({ key, translations: keyTranslations }) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                    {key}
                  </td>
                  {languages
                    .filter(l => selectedLanguage === 'all' || l.code === selectedLanguage)
                    .map(lang => (
                      <td key={lang.code} className="px-4 py-3 text-sm">
                        {editingKey === key ? (
                          <input
                            type="text"
                            value={editValues[lang.code] || ''}
                            onChange={(e) => setEditValues({ ...editValues, [lang.code]: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <span className="text-gray-700">
                            {keyTranslations[lang.code]?.translation_value || '-'}
                          </span>
                        )}
                      </td>
                    ))}
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                    {editingKey === key ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(key)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(key, keyTranslations)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => autoTranslateKey(key)}
                          disabled={isTranslating}
                          className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                          title="Türkçe'den otomatik çevir"
                        >
                          <RefreshCw className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => deleteTranslation(key)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Hiç çeviri bulunamadı
        </div>
      )}
    </div>
  );
};

export default TranslationManagement;
