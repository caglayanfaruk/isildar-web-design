import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Search, Filter, Image, FileText, Download, Eye, CreditCard as Edit, X, Plus, Grid2x2 as Grid, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  alt_text?: string;
  caption?: string;
  folder: string;
  uploaded_by?: string;
  created_at: string;
}

const MediaManagement = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadFolder, setUploadFolder] = useState('uploads');
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [unusedMediaIds, setUnusedMediaIds] = useState<string[]>([]);
  const [checkingUnused, setCheckingUnused] = useState(false);

  useEffect(() => {
    loadMediaFiles();
  }, [selectedFolder, selectedType, searchTerm, showUnusedOnly]);

  const loadMediaFiles = async () => {
    try {
      let query = supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedFolder) {
        query = query.eq('folder', selectedFolder);
      }

      if (selectedType) {
        query = query.like('mime_type', `${selectedType}%`);
      }

      if (searchTerm) {
        query = query.or(`original_name.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (showUnusedOnly && unusedMediaIds.length > 0) {
        filteredData = filteredData.filter(file => unusedMediaIds.includes(file.id));
      }

      setMediaFiles(filteredData);
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('Medya dosyaları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`${file.name} dosyası çok büyük (max 10MB)`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${uploadFolder}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('media')
          .insert({
            filename: fileName,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            url: urlData.publicUrl,
            folder: uploadFolder,
            uploaded_by: null
          });

        if (dbError) throw dbError;

        return fileName;
      });

      await Promise.all(uploadPromises);
      toast.success(`${files.length} dosya başarıyla yüklendi`);
      setShowUploadModal(false);
      setSelectedFiles([]);
      loadMediaFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Dosya yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateFile = async (file: MediaFile) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({
          alt_text: file.alt_text,
          caption: file.caption
        })
        .eq('id', file.id);

      if (error) throw error;
      toast.success('Dosya bilgileri güncellendi');
      setEditingFile(null);
      loadMediaFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const findUnusedMedia = async () => {
    setCheckingUnused(true);
    try {
      // Get all media IDs
      const { data: allMedia } = await supabase
        .from('media')
        .select('id');

      if (!allMedia) return;

      const allMediaIds = allMedia.map(m => m.id);

      // Check all tables that reference media
      const usedMediaIds = new Set<string>();

      // Categories
      const { data: categories } = await supabase
        .from('categories')
        .select('image_id')
        .not('image_id', 'is', null);
      categories?.forEach(c => c.image_id && usedMediaIds.add(c.image_id));

      // Product images
      const { data: productImages } = await supabase
        .from('product_images')
        .select('media_id');
      productImages?.forEach(pi => usedMediaIds.add(pi.media_id));

      // Product documents
      const { data: productDocuments } = await supabase
        .from('product_documents')
        .select('media_id');
      productDocuments?.forEach(pd => usedMediaIds.add(pd.media_id));

      // Blog posts (if exists)
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('featured_image_id')
        .not('featured_image_id', 'is', null);
      blogPosts?.forEach(bp => bp.featured_image_id && usedMediaIds.add(bp.featured_image_id));

      // News posts (if exists)
      const { data: newsPosts } = await supabase
        .from('news')
        .select('featured_image_id')
        .not('featured_image_id', 'is', null);
      newsPosts?.forEach(np => np.featured_image_id && usedMediaIds.add(np.featured_image_id));

      // Sliders (if exists)
      const { data: sliders } = await supabase
        .from('sliders')
        .select('image_id')
        .not('image_id', 'is', null);
      sliders?.forEach(s => s.image_id && usedMediaIds.add(s.image_id));

      // Slider items (if exists)
      const { data: sliderItems } = await supabase
        .from('slider_items')
        .select('image_id')
        .not('image_id', 'is', null);
      sliderItems?.forEach(si => si.image_id && usedMediaIds.add(si.image_id));

      // Find unused
      const unused = allMediaIds.filter(id => !usedMediaIds.has(id));
      setUnusedMediaIds(unused);

      toast.success(`${unused.length} kullanılmayan medya bulundu`);
      setShowUnusedOnly(true);
    } catch (error) {
      console.error('Error finding unused media:', error);
      toast.error('Kullanılmayan medya taranırken hata oluştu');
    } finally {
      setCheckingUnused(false);
    }
  };

  const deleteUnusedMedia = async () => {
    if (unusedMediaIds.length === 0) {
      toast.error('Silinecek kullanılmayan medya bulunamadı');
      return;
    }

    if (!confirm(`${unusedMediaIds.length} adet kullanılmayan medya dosyası silinecek. Emin misiniz?`)) {
      return;
    }

    try {
      // Get file URLs first
      const { data: filesToDelete } = await supabase
        .from('media')
        .select('url')
        .in('id', unusedMediaIds);

      // Delete from storage
      if (filesToDelete) {
        const filePaths = filesToDelete.map(f => {
          const url = new URL(f.url);
          return url.pathname.split('/').slice(-2).join('/');
        });

        await supabase.storage
          .from('media')
          .remove(filePaths);
      }

      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .in('id', unusedMediaIds);

      if (error) throw error;

      toast.success(`${unusedMediaIds.length} kullanılmayan medya silindi`);
      setUnusedMediaIds([]);
      setShowUnusedOnly(false);
      loadMediaFiles();
    } catch (error) {
      console.error('Error deleting unused media:', error);
      toast.error('Kullanılmayan medya silinirken hata oluştu');
    }
  };

  const handleDeleteFile = async (id: string, url: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

    try {
      // Delete from storage
      const filePath = url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('media')
          .remove([`uploads/${filePath}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Dosya silindi');
      loadMediaFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
  };

  const folders = ['uploads', 'products', 'blog', 'news', 'sliders', 'logos'];
  const fileTypes = ['image', 'application', 'text', 'video'];

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
          <h1 className="text-2xl font-bold text-gray-900">Medya Yönetimi</h1>
          <p className="text-gray-600 mt-1">Görsel ve dosya kütüphanesini yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          <button
            onClick={findUnusedMedia}
            disabled={checkingUnused}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Filter className="w-4 h-4" />
            <span>{checkingUnused ? 'Taranıyor...' : 'Kullanılmayanları Bul'}</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Dosya Yükle</span>
          </button>
        </div>
      </div>

      {/* Unused Media Alert */}
      {showUnusedOnly && unusedMediaIds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Kullanılmayan Medya Dosyaları</h3>
                <p className="text-sm text-orange-700">
                  {unusedMediaIds.length} adet kullanılmayan medya dosyası bulundu. Bu dosyalar hiçbir yerde kullanılmıyor.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={deleteUnusedMedia}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hepsini Sil</span>
              </button>
              <button
                onClick={() => {
                  setShowUnusedOnly(false);
                  loadMediaFiles();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Filtreyi Kaldır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klasör</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Klasörler</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Türü</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Türler</option>
              <option value="image">Görseller</option>
              <option value="application">Dökümanlar</option>
              <option value="video">Videolar</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dosya adı veya alt metin ara..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaFiles.map((file) => {
              const IconComponent = getFileIcon(file.mime_type);
              return (
                <div key={file.id} className="group relative bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
                  <div className="aspect-square flex items-center justify-center p-4">
                    {file.mime_type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.alt_text || file.original_name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <IconComponent className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingFile(file)}
                        className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.url)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {file.original_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size_bytes)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boyut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klasör
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mediaFiles.map((file) => {
                  const IconComponent = getFileIcon(file.mime_type);
                  return (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                            {file.mime_type.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.alt_text || file.original_name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <IconComponent className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {file.original_name}
                            </div>
                            {file.alt_text && (
                              <div className="text-sm text-gray-500">
                                {file.alt_text}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {file.mime_type.split('/')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.size_bytes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.folder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingFile(file)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.url)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dosya Yükle</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hedef Klasör
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Dosyaları sürükleyip bırakın veya seçin</p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Dosya Seç</span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Maksimum 10MB, JPG, PNG, PDF, DOC, DOCX formatları
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Seçilen Dosyalar:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleFileUpload(selectedFiles)}
                disabled={uploading || selectedFiles.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Yükleniyor...' : 'Yükle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dosya Düzenle</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {editingFile.mime_type.startsWith('image/') ? (
                  <img
                    src={editingFile.url}
                    alt={editingFile.alt_text || editingFile.original_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Dosya:</strong> {editingFile.original_name}</p>
                  <p><strong>Boyut:</strong> {formatFileSize(editingFile.size_bytes)}</p>
                  <p><strong>Tür:</strong> {editingFile.mime_type}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Metin
                  </label>
                  <input
                    type="text"
                    value={editingFile.alt_text || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, alt_text: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Görsel açıklaması..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={editingFile.caption || ''}
                    onChange={(e) => setEditingFile({ ...editingFile, caption: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Görsel başlığı..."
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Dosya URL'si</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingFile.url}
                      readOnly
                      className="flex-1 bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editingFile.url);
                        toast.success('URL kopyalandı');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleUpdateFile(editingFile)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Depolama Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mediaFiles.length}</div>
            <div className="text-sm text-gray-600">Toplam Dosya</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {mediaFiles.filter(f => f.mime_type.startsWith('image/')).length}
            </div>
            <div className="text-sm text-gray-600">Görsel</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {mediaFiles.filter(f => f.mime_type.startsWith('application/')).length}
            </div>
            <div className="text-sm text-gray-600">Döküman</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatFileSize(mediaFiles.reduce((total, file) => total + file.size_bytes, 0))}
            </div>
            <div className="text-sm text-gray-600">Toplam Boyut</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaManagement;