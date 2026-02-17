import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

interface Project {
  id: string;
  slug: string;
  featured_image_url: string | null;
  project_date: string | null;
  client_name: string | null;
  location: string | null;
  translations?: {
    title: string;
    description: string;
    content: string;
  };
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [currentLanguage]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const projectsWithData = await Promise.all(
        (data || []).map(async (project) => {
          let imageUrl = null;
          if (project.featured_image_id) {
            const { data: media, error: mediaError } = await supabase
              .from('media')
              .select('storage_path, url')
              .eq('id', project.featured_image_id)
              .maybeSingle();

            if (media && !mediaError) {
              if (media.url) {
                imageUrl = media.url;
              } else if (media.storage_path) {
                const { data: urlData } = supabase.storage
                  .from('images')
                  .getPublicUrl(media.storage_path);
                imageUrl = urlData.publicUrl;
              }
            } else if (mediaError) {
              console.error('Error loading media for project:', project.slug, mediaError);
            }
          }

          // Türkçe çevirileri al
          const { data: trTranslations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', 'tr')
            .in('translation_key', [
              `project.${project.slug}.title`,
              `project.${project.slug}.description`,
              `project.${project.slug}.content`
            ]);

          const trMap: any = {};
          trTranslations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            trMap[key] = t.translation_value || t.source_text;
          });

          // Seçili dile çevir
          const [translatedTitle, translatedDescription, translatedContent] = await Promise.all([
            translate(trMap.title || project.slug, currentLanguage, `project.${project.slug}.title`, { type: 'project' }),
            translate(trMap.description || '', currentLanguage, `project.${project.slug}.description`, { type: 'project' }),
            translate(trMap.content || '', currentLanguage, `project.${project.slug}.content`, { type: 'project' })
          ]);

          return {
            ...project,
            featured_image_url: imageUrl,
            translations: {
              title: translatedTitle,
              description: translatedDescription,
              content: translatedContent
            }
          };
        })
      );

      setProjects(projectsWithData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Referanslarımız
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Tamamladığımız projeler ve başarı hikayelerimiz
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Henüz proje eklenmemiş</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  {project.featured_image_url && (
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={project.featured_image_url}
                        alt={project.translations?.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                      {project.translations?.title || project.slug}
                    </h3>

                    <p className="text-gray-400 mb-4 line-clamp-3">
                      {project.translations?.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      {project.client_name && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span>{project.client_name}</span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.project_date && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.project_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}</span>
                        </div>
                      )}
                    </div>

                    <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 group">
                      <span>Detayları Gör</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProject.featured_image_url && (
              <div className="relative h-96">
                <img
                  src={selectedProject.featured_image_url}
                  alt={selectedProject.translations?.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="p-8">
              <h2 className="text-4xl font-bold text-white mb-4">
                {selectedProject.translations?.title}
              </h2>

              <div className="flex flex-wrap gap-4 mb-6">
                {selectedProject.client_name && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <User className="w-5 h-5" />
                    <span>{selectedProject.client_name}</span>
                  </div>
                )}
                {selectedProject.location && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{selectedProject.location}</span>
                  </div>
                )}
                {selectedProject.project_date && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(selectedProject.project_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedProject.translations?.content || selectedProject.translations?.description || '' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
