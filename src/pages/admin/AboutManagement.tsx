import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CreditCard as Edit, X, Info, Award, Users, Building, Target, Clock, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AboutContent {
  id: string;
  section_type: 'story' | 'milestone' | 'value' | 'achievement' | 'certification' | 'team';
  language_code: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content_data: any;
  display_order: number;
  is_active: boolean;
}

const AboutManagement = () => {
  const [story, setStory] = useState<AboutContent | null>(null);
  const [milestones, setMilestones] = useState<AboutContent[]>([]);
  const [values, setValues] = useState<AboutContent[]>([]);
  const [achievements, setAchievements] = useState<AboutContent[]>([]);
  const [certifications, setCertifications] = useState<AboutContent[]>([]);
  const [teams, setTeams] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'milestones' | 'values' | 'achievements' | 'certifications' | 'teams'>('story');
  const [editingItem, setEditingItem] = useState<AboutContent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('tr');

  useEffect(() => {
    loadAboutData();
  }, [currentLanguage]);

  const loadAboutData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('language_code', currentLanguage)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        setStory(data.find(item => item.section_type === 'story') || null);
        setMilestones(data.filter(item => item.section_type === 'milestone'));
        setValues(data.filter(item => item.section_type === 'value'));
        setAchievements(data.filter(item => item.section_type === 'achievement'));
        setCertifications(data.filter(item => item.section_type === 'certification'));
        setTeams(data.filter(item => item.section_type === 'team'));
      }
    } catch (error) {
      console.error('Error loading about data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStory = async () => {
    if (!story) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('about_content')
        .upsert({
          ...story,
          language_code: currentLanguage,
          section_type: 'story'
        });

      if (error) throw error;
      toast.success('Hikaye kaydedildi');
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItem = async (item: Partial<AboutContent>, sectionType: AboutContent['section_type']) => {
    try {
      const { error } = await supabase
        .from('about_content')
        .upsert({
          ...item,
          language_code: currentLanguage,
          section_type: sectionType,
          is_active: true
        });

      if (error) throw error;

      toast.success('Kaydedildi');
      loadAboutData();
      setEditingItem(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('about_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Silindi');
      loadAboutData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const tabs = [
    { id: 'story', name: 'Hikaye', icon: Info },
    { id: 'milestones', name: 'Tarihçe', icon: Clock },
    { id: 'values', name: 'Değerlerimiz', icon: Target },
    { id: 'achievements', name: 'Başarılar', icon: Award },
    { id: 'certifications', name: 'Sertifikalar', icon: Shield },
    { id: 'teams', name: 'Ekibimiz', icon: Users }
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
          <h1 className="text-2xl font-bold text-gray-900">Hakkımızda Yönetimi</h1>
          <p className="text-gray-600 mt-1">Şirket bilgilerini ve hikayesini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
          {activeTab === 'story' ? (
            <button
              onClick={handleSaveStory}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Story Content */}
      {activeTab === 'story' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlık
              </label>
              <input
                type="text"
                value={story?.title || ''}
                onChange={(e) => setStory(story ? { ...story, title: e.target.value } : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hikayemiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Başlık
              </label>
              <input
                type="text"
                value={story?.subtitle || ''}
                onChange={(e) => setStory(story ? { ...story, subtitle: e.target.value } : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IŞILDAR Aydınlatma San. ve Tic. A.Ş."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şirket Hikayesi (Her paragraf ayrı satırda)
              </label>
              <textarea
                value={story?.content_data?.paragraphs?.join('\n\n') || ''}
                onChange={(e) => {
                  const paragraphs = e.target.value.split('\n\n').filter(p => p.trim());
                  setStory(story ? {
                    ...story,
                    content_data: { ...story.content_data, paragraphs }
                  } : null);
                }}
                rows={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="İlk paragraf...

İkinci paragraf...

Üçüncü paragraf..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Her paragrafı iki satır boşlukla ayırın
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl font-bold text-blue-600">{milestone.title}</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(milestone)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(milestone.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2">{milestone.subtitle}</div>
                <div className="text-sm text-gray-600">{milestone.content_data?.description}</div>
              </div>
            ))}
          </div>

          {(showAddForm || editingItem?.section_type === 'milestone') && (
            <MilestoneForm
              item={editingItem}
              onSave={(data) => handleSaveItem(data, 'milestone')}
              onCancel={() => { setEditingItem(null); setShowAddForm(false); }}
            />
          )}
        </div>
      )}

      {/* Values */}
      {activeTab === 'values' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div key={value.id} className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${value.content_data?.color || 'blue'}-100 flex items-center justify-center`}>
                    <Target className={`w-6 h-6 text-${value.content_data?.color || 'blue'}-600`} />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingItem(value)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteItem(value.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>

          {(showAddForm || editingItem?.section_type === 'value') && (
            <ValueForm
              item={editingItem}
              onSave={(data) => handleSaveItem(data, 'value')}
              onCancel={() => { setEditingItem(null); setShowAddForm(false); }}
            />
          )}
        </div>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white rounded-lg shadow-sm p-6 border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-end mb-2">
                  <button onClick={() => setEditingItem(achievement)} className="text-blue-600 hover:text-blue-800 mr-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteItem(achievement.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{achievement.title}</div>
                <div className="text-sm text-gray-600">{achievement.subtitle}</div>
              </div>
            ))}
          </div>

          {(showAddForm || editingItem?.section_type === 'achievement') && (
            <SimpleForm
              item={editingItem}
              onSave={(data) => handleSaveItem(data, 'achievement')}
              onCancel={() => { setEditingItem(null); setShowAddForm(false); }}
              fields={[
                { name: 'title', label: 'Sayı/Değer', placeholder: '53+' },
                { name: 'subtitle', label: 'Açıklama', placeholder: 'Yıllık Deneyim' }
              ]}
            />
          )}
        </div>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-white rounded-lg shadow-sm p-4 border flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">{cert.title}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingItem(cert)} className="text-blue-600 hover:text-blue-800">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteItem(cert.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(showAddForm || editingItem?.section_type === 'certification') && (
            <SimpleForm
              item={editingItem}
              onSave={(data) => handleSaveItem(data, 'certification')}
              onCancel={() => { setEditingItem(null); setShowAddForm(false); }}
              fields={[{ name: 'title', label: 'Sertifika Adı', placeholder: 'ISO 9001:2015' }]}
            />
          )}
        </div>
      )}

      {/* Teams */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow-sm p-6 border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-end mb-2">
                  <button onClick={() => setEditingItem(team)} className="text-blue-600 hover:text-blue-800 mr-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteItem(team.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">{team.title}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{team.subtitle}</div>
                <div className="text-sm text-gray-600">{team.description}</div>
              </div>
            ))}
          </div>

          {(showAddForm || editingItem?.section_type === 'team') && (
            <SimpleForm
              item={editingItem}
              onSave={(data) => handleSaveItem(data, 'team')}
              onCancel={() => { setEditingItem(null); setShowAddForm(false); }}
              fields={[
                { name: 'title', label: 'Sayı', placeholder: '15+' },
                { name: 'subtitle', label: 'Ekip Adı', placeholder: 'Ar-Ge Ekibi' },
                { name: 'description', label: 'Açıklama', placeholder: 'Yenilikçi ürün geliştirme' }
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Helper Components
const MilestoneForm = ({ item, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    id: item?.id,
    title: item?.title || '',
    subtitle: item?.subtitle || '',
    description: item?.content_data?.description || '',
    display_order: item?.display_order || 0
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <h3 className="text-lg font-semibold mb-4">{item ? 'Düzenle' : 'Yeni Ekle'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Yıl (örn: 1972)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          placeholder="Başlık"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          placeholder="Açıklama"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 md:col-span-2"
        />
        <div className="md:col-span-2 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">İptal</button>
          <button
            onClick={() => onSave({ ...formData, content_data: { description: formData.description } })}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

const ValueForm = ({ item, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    id: item?.id,
    title: item?.title || '',
    description: item?.description || '',
    color: item?.content_data?.color || 'blue',
    display_order: item?.display_order || 0
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <h3 className="text-lg font-semibold mb-4">{item ? 'Düzenle' : 'Yeni Ekle'}</h3>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Başlık"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Açıklama"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          rows={3}
        />
        <select
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="blue">Mavi</option>
          <option value="red">Kırmızı</option>
          <option value="green">Yeşil</option>
          <option value="yellow">Sarı</option>
          <option value="purple">Mor</option>
        </select>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">İptal</button>
          <button
            onClick={() => onSave({ ...formData, content_data: { color: formData.color } })}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

const SimpleForm = ({ item, onSave, onCancel, fields }: any) => {
  const [formData, setFormData] = useState(
    fields.reduce((acc: any, field: any) => ({
      ...acc,
      [field.name]: item?.[field.name] || ''
    }), { id: item?.id, display_order: item?.display_order || 0 })
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <h3 className="text-lg font-semibold mb-4">{item ? 'Düzenle' : 'Yeni Ekle'}</h3>
      <div className="space-y-4">
        {fields.map((field: any) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type="text"
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        ))}
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">İptal</button>
          <button onClick={() => onSave(formData)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutManagement;
