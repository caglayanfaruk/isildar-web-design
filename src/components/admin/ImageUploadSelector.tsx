import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Search, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type: string;
}

interface ImageUploadSelectorProps {
  value?: string;
  onChange?: (mediaId: string, url: string) => void;
  label?: string;
  folder?: string;
  multiple?: boolean;
  selectedIds?: string[];
  onSelect?: (mediaIds: string[]) => void;
  onRemove?: (mediaId: string) => void;
  hideSelectedPreview?: boolean;
}

const ImageUploadSelector: React.FC<ImageUploadSelectorProps> = ({
  value,
  onChange,
  label = 'Görsel Seç',
  folder = 'categories',
  multiple = false,
  selectedIds = [],
  onSelect,
  onRemove,
  hideSelectedPreview = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImage, setCurrentImage] = useState<{ id: string; url: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (value) {
      loadCurrentImage(value);
    }
  }, [value]);

  useEffect(() => {
    if (showModal) {
      loadMediaFiles();
    }
  }, [showModal, searchTerm]);

  useEffect(() => {
    if (multiple && selectedIds.length > 0) {
      loadMediaFiles();
    }
  }, []);

  const loadCurrentImage = async (mediaId: string) => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('id, url')
        .eq('id', mediaId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCurrentImage(data);
      }
    } catch (error) {
      console.error('Error loading current image:', error);
    }
  };

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('media')
        .select('id, filename, original_name, url, mime_type')
        .like('mime_type', 'image/%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`original_name.ilike.%${searchTerm}%,filename.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('Medya dosyaları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        throw new Error('Lütfen sadece görsel dosyası yükleyin');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { data: mediaData, error: dbError } = await supabase
        .from('media')
        .insert({
          filename: fileName,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          url: urlData.publicUrl,
          folder: folder,
          uploaded_by: null
        })
        .select('id, url')
        .single();

      if (dbError) throw dbError;

      toast.success('Görsel başarıyla yüklendi');

      if (multiple && onSelect) {
        onSelect([mediaData.id]);
      } else if (onChange) {
        onChange(mediaData.id, mediaData.url);
        setCurrentImage({ id: mediaData.id, url: mediaData.url });
        setShowModal(false);
      }

      loadMediaFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Dosya yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = (media: MediaFile) => {
    if (multiple && onSelect) {
      if (selectedIds.includes(media.id)) {
        return;
      }
      onSelect([media.id]);
    } else if (onChange) {
      onChange(media.id, media.url);
      setCurrentImage({ id: media.id, url: media.url });
      setShowModal(false);
    }
  };

  const handleRemoveImage = (mediaId?: string) => {
    if (multiple && onRemove && mediaId) {
      onRemove(mediaId);
    } else if (onChange) {
      onChange('', '');
      setCurrentImage(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {!multiple && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {multiple ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors py-4 flex flex-col items-center justify-center text-gray-500 hover:text-blue-500"
          >
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm">Görsel Seç veya Yükle</span>
          </button>

          {!hideSelectedPreview && selectedIds.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {selectedIds.map((id) => {
                const media = mediaFiles.find(m => m.id === id);
                return (
                  <div key={id} className="relative group">
                    {media && (
                      <>
                        <img
                          src={media.url}
                          alt={media.filename}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : currentImage ? (
        <div className="relative group">
          <img
            src={currentImage.url}
            alt={label}
            className="w-full h-48 object-contain rounded-lg border-2 border-gray-300 bg-gray-50"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="bg-white text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Değiştir
              </button>
              <button
                type="button"
                onClick={() => handleRemoveImage()}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-blue-500"
        >
          <ImageIcon className="w-12 h-12 mb-2" />
          <span className="text-sm">Görsel Seç veya Yükle</span>
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Görsel Seç veya Yükle</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    {uploading ? 'Yükleniyor...' : 'Görseli sürükleyip bırakın veya tıklayın'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP - Max 5MB</p>
                </label>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Görsel ara..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                  <p>Henüz görsel yüklenmemiş</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaFiles.map((media) => {
                    const isSelected = multiple
                      ? selectedIds.includes(media.id)
                      : currentImage?.id === media.id;

                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => handleSelectImage(media)}
                        className={`relative group aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <img
                          src={media.url}
                          alt={media.original_name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                          <div className="p-2 text-white text-xs truncate w-full bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            {media.original_name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadSelector;
