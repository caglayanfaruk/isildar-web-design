import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Calendar, MapPin, User, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveAndTranslate } from '../../services/unifiedTranslationService';
import toast from 'react-hot-toast';
import ImageUploadSelector from '../../components/admin/ImageUploadSelector';
import RichTextEditor from '../../components/admin/RichTextEditor';

interface Project {
  id: string;
  slug: string;
  featured_image_id: string | null;
  featured_image_url?: string;
  sort_order: number;
  is_active: boolean;
  project_date: string | null;
  client_name: string | null;
  location: string | null;
  translations?: {
    title: string;
    description: string;
    content: string;
  };
}

interface Language {
  code: string;
  name: string;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('tr');

  const emptyProject: Omit<Project, 'id'> = {
    slug: '',
    featured_image_id: null,
    sort_order: 0,
    is_active: true,
    project_date: null,
    client_name: null,
    location: null,
    translations: {
      title: '',
      description: '',
      content: ''
    }
  };

  useEffect(() => {
    loadLanguages();
    loadProjects();
  }, []);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setLanguages(data || []);
      if (data && data.length > 0) {
        setCurrentLanguage(data[0].code);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      toast.error('Diller yüklenirken hata oluştu');
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      const projectsWithTranslations = await Promise.all(
        (data || []).map(async (project) => {
          let imageUrl = null;
          if (project.featured_image_id) {
            const { data: media } = await supabase
              .from('media')
              .select('file_path, storage_path')
              .eq('id', project.featured_image_id)
              .maybeSingle();

            if (media) {
              if (media.storage_path) {
                const { data: urlData } = supabase.storage
                  .from('images')
                  .getPublicUrl(media.storage_path);
                imageUrl = urlData.publicUrl;
              } else if (media.file_path) {
                imageUrl = media.file_path;
              }
            }
          }

          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .in('translation_key', [
              `project.${project.slug}.title`,
              `project.${project.slug}.description`,
              `project.${project.slug}.content`
            ]);

          const translationMap: any = {
            title: '',
            description: '',
            content: ''
          };

          translations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            translationMap[key] = t.translation_value;
          });

          return {
            ...project,
            featured_image_url: imageUrl,
            translations: translationMap
          };
        })
      );

      setProjects(projectsWithTranslations);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Projeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;

    try {
      const projectData = {
        slug: editingProject.slug,
        featured_image_id: editingProject.featured_image_id,
        sort_order: editingProject.sort_order,
        is_active: editingProject.is_active,
        project_date: editingProject.project_date,
        client_name: editingProject.client_name,
        location: editingProject.location,
        updated_at: new Date().toISOString()
      };

      let savedProject;
      if (editingProject.id) {
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)
          .select()
          .single();

        if (error) throw error;
        savedProject = data;
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (error) throw error;
        savedProject = data;
      }

      // Otomatik çeviri: Türkçe metinleri tüm dillere çevir ve kaydet
      if (editingProject.translations?.title) {
        await saveAndTranslate(
          editingProject.translations.title,
          `project.${savedProject.slug}.title`,
          'project',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (editingProject.translations?.description) {
        await saveAndTranslate(
          editingProject.translations.description,
          `project.${savedProject.slug}.description`,
          'project',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (editingProject.translations?.content) {
        await saveAndTranslate(
          editingProject.translations.content,
          `project.${savedProject.slug}.content`,
          'project',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      toast.success('Proje kaydedildi');
      setIsFormOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Proje kaydedilirken hata oluştu');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Bu projeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const project = projects.find(p => p.id === id);
      if (project) {
        await supabase
          .from('translations')
          .delete()
          .like('translation_key', `project.${project.slug}.%`);
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Proje silindi');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Proje silinirken hata oluştu');
    }
  };

  const handleMoveProject = async (id: string, direction: 'up' | 'down') => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === projects.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newProjects = [...projects];
    [newProjects[index], newProjects[newIndex]] = [newProjects[newIndex], newProjects[index]];

    try {
      await Promise.all(
        newProjects.map((project, idx) =>
          supabase
            .from('projects')
            .update({ sort_order: idx })
            .eq('id', project.id)
        )
      );

      setProjects(newProjects);
      toast.success('Sıralama güncellendi');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referans Yönetimi</h1>
          <p className="text-gray-400 mt-1">Tamamlanan projeleri ve referansları yönetin</p>
        </div>
        <button
          onClick={() => {
            setEditingProject({ ...emptyProject, id: '' } as Project);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Proje</span>
        </button>
      </div>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <div key={project.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start space-x-6">
              {project.featured_image_url && (
                <img
                  src={project.featured_image_url}
                  alt={project.translations?.title}
                  className="w-48 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {project.translations?.title || project.slug}
                    </h3>
                    <p className="text-gray-400 mt-2">
                      {project.translations?.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      {project.client_name && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{project.client_name}</span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.project_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.project_date).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMoveProject(project.id, 'up')}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleMoveProject(project.id, 'down')}
                      disabled={index === projects.length - 1}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs ${
                project.is_active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {project.is_active ? 'Aktif' : 'Pasif'}
              </span>
              <span className="text-xs text-gray-500">Slug: {project.slug}</span>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-white">
                {editingProject.id ? 'Projeyi Düzenle' : 'Yeni Proje'}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingProject(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setCurrentLanguage(lang.code)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Slug (URL-dostu isim)
                </label>
                <input
                  type="text"
                  value={editingProject.slug}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="ornek-proje-adi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Proje Başlığı ({currentLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={editingProject.translations?.title || ''}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    translations: {
                      ...editingProject.translations!,
                      title: e.target.value
                    }
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Kısa Açıklama ({currentLanguage.toUpperCase()})
                </label>
                <textarea
                  value={editingProject.translations?.description || ''}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    translations: {
                      ...editingProject.translations!,
                      description: e.target.value
                    }
                  })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Detaylı İçerik ({currentLanguage.toUpperCase()})
                </label>
                <RichTextEditor
                  value={editingProject.translations?.content || ''}
                  onChange={(value) => setEditingProject({
                    ...editingProject,
                    translations: {
                      ...editingProject.translations!,
                      content: value
                    }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Proje Görseli
                </label>
                <ImageUploadSelector
                  value={editingProject.featured_image_id}
                  onChange={(id) => setEditingProject({ ...editingProject, featured_image_id: id })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Müşteri/Firma Adı
                  </label>
                  <input
                    type="text"
                    value={editingProject.client_name || ''}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      client_name: e.target.value
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Lokasyon
                  </label>
                  <input
                    type="text"
                    value={editingProject.location || ''}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      location: e.target.value
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Proje Tarihi
                </label>
                <input
                  type="date"
                  value={editingProject.project_date || ''}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    project_date: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingProject.is_active}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    is_active: e.target.checked
                  })}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-400">
                  Aktif (Sitede göster)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-6 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveProject}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
