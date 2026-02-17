import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

interface QuickMenuDocument {
  id: string;
  type: string;
  language_code: string;
  file_id: string;
  version: string;
  is_active: boolean;
  sort_order: number;
  display_name?: string;
  media?: {
    id: string;
    url: string;
    filename: string;
  };
}

const QuickMenu: React.FC = () => {
  const [documents, setDocuments] = useState<QuickMenuDocument[]>([]);
  const { t, currentLanguage, isLoading } = useTranslation();

  useEffect(() => {
    if (!isLoading) {
      loadDocuments();
    }
  }, [currentLanguage, isLoading]);

  const loadDocuments = async () => {
    try {
      let { data, error } = await supabase
        .from('quick_menu_documents')
        .select(`
          *,
          media:file_id (
            id,
            url,
            filename
          )
        `)
        .eq('is_active', true)
        .eq('language_code', currentLanguage)
        .order('sort_order');

      if (error) {
        console.error('Error loading documents:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        const fallback = await supabase
          .from('quick_menu_documents')
          .select(`
            *,
            media:file_id (
              id,
              url,
              filename
            )
          `)
          .eq('is_active', true)
          .eq('language_code', 'tr')
          .order('sort_order');

        if (!fallback.error) {
          data = fallback.data;
        }
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading quick menu documents:', error);
    }
  };

  const handleDownload = (doc: QuickMenuDocument) => {
    if (doc.media?.url) {
      window.open(doc.media.url, '_blank');
    } else {
      console.error('No media URL found for document:', doc);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'catalog':
        return FileText;
      case 'price_list':
        return Download;
      default:
        return FileText;
    }
  };

  if (isLoading || documents.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
      <div className="bg-black/90 backdrop-blur-xl border-l border-white/20 w-12 flex flex-col">
        {documents.map((doc, index) => {
          const IconComponent = getIcon(doc.type);
          const translationKey = `quick_menu.${doc.type}.title`;
          const title = t(translationKey, doc.display_name || doc.type);

          return (
            <button
              key={doc.id}
              onClick={() => handleDownload(doc)}
              className={`h-12 flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300 group relative ${
                index > 0 ? 'border-t border-white/10' : ''
              }`}
            >
              <IconComponent className="w-5 h-5" />

              <div className="absolute right-full mr-2 bg-black/90 backdrop-blur-xl text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none border border-white/20">
                {title}
                {doc.version && (
                  <div className="text-xs text-gray-400 mt-0.5">v{doc.version}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickMenu;
