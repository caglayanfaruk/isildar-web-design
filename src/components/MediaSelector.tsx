import React, { useState, useEffect } from 'react';
import { X, Search, Check, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Media {
  id: string;
  url: string;
  alt_text?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaIds: string[]) => void;
  multiSelect?: boolean;
  selectedIds?: string[];
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false,
  selectedIds = []
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelected(selectedIds);
    }
  }, [isOpen, selectedIds]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Medya yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (mediaId: string) => {
    if (multiSelect) {
      setSelected(prev =>
        prev.includes(mediaId)
          ? prev.filter(id => id !== mediaId)
          : [...prev, mediaId]
      );
    } else {
      setSelected([mediaId]);
    }
  };

  const handleSelect = () => {
    onSelect(selected);
    onClose();
  };

  const filteredMedia = media.filter(m =>
    m.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.alt_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medya Seç</h2>
            <p className="text-sm text-gray-600 mt-1">
              {multiSelect ? 'Birden fazla medya seçebilirsiniz' : 'Bir medya seçin'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Medya ara..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Medya bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item.mime_type.startsWith('image/') ? (
                      <img
                        src={item.url}
                        alt={item.alt_text || item.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-xs font-medium truncate">
                        {item.file_name}
                      </p>
                      <p className="text-white/70 text-xs">
                        {(item.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selected.length} medya seçildi
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSelect}
              disabled={selected.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Seç ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSelector;
