import React, { useState, useEffect } from 'react';
import { Upload, X, Video, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface VideoUploadSelectorProps {
  selectedVideoUrl: string | null;
  onVideoSelect: (url: string) => void;
  onVideoRemove: () => void;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

const VideoUploadSelector: React.FC<VideoUploadSelectorProps> = ({
  selectedVideoUrl,
  onVideoSelect,
  onVideoRemove
}) => {
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (showSelector) {
      loadVideos();
    }
  }, [showSelector]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .like('mime_type', 'video/%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Videolar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Lütfen sadece video dosyası yükleyin');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video dosyası 100MB\'dan küçük olmalıdır');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { data: mediaData, error: dbError } = await supabase
        .from('media')
        .insert([{
          url: publicUrl,
          filename: fileName,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          folder: 'videos'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Video başarıyla yüklendi');
      onVideoSelect(publicUrl);
      setShowSelector(false);
      loadVideos();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Video yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {selectedVideoUrl ? (
        <div className="relative group">
          <video
            src={selectedVideoUrl}
            controls
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            onClick={onVideoRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSelector(true)}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <Video className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-2" />
          <span className="text-sm text-gray-600 group-hover:text-blue-600">Video Seç</span>
        </button>
      )}

      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Video Seç</h2>
              <button
                onClick={() => setShowSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Yükleniyor...' : 'Video Yükle (Max 100MB)'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">MP4, WebM, MOV</span>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz video yüklenmemiş</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        onVideoSelect(video.url);
                        setShowSelector(false);
                      }}
                      className="relative group cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                    >
                      <div className="relative bg-black h-40 flex items-center justify-center">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {video.original_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(video.size_bytes)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadSelector;
