import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DocumentUploadSelectorProps {
  selectedDocumentId: string | null;
  onDocumentSelect: (documentId: string) => void;
  onDocumentRemove: () => void;
  acceptedFileTypes?: string[];
}

interface UploadedDocument {
  id: string;
  url: string;
  filename: string;
}

const DocumentUploadSelector: React.FC<DocumentUploadSelectorProps> = ({
  selectedDocumentId,
  onDocumentSelect,
  onDocumentRemove,
  acceptedFileTypes = ['.pdf', '.doc', '.docx']
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);

  React.useEffect(() => {
    if (selectedDocumentId) {
      loadDocument(selectedDocumentId);
    } else {
      setSelectedDocument(null);
    }
  }, [selectedDocumentId]);

  const loadDocument = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('id, url, filename')
        .eq('id', docId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedDocument(data);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const uploadDocument = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

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

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .insert([{
          url: publicUrl,
          filename: fileName,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          storage_path: filePath,
          alt_text: file.name
        }])
        .select()
        .single();

      if (mediaError) throw mediaError;

      setSelectedDocument({
        id: mediaData.id,
        url: mediaData.url,
        filename: mediaData.filename
      });

      onDocumentSelect(mediaData.id);
      toast.success('Döküman yüklendi');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Yükleme hatası');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      if (file.size > 50 * 1024 * 1024) {
        toast.error('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }

      uploadDocument(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading
  });

  const handleRemove = () => {
    setSelectedDocument(null);
    onDocumentRemove();
  };

  if (selectedDocument) {
    return (
      <div className="relative border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedDocument.filename}
            </p>
            <a
              href={selectedDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Dosyayı görüntüle
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Yükleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive
              ? 'Dosyayı buraya bırakın'
              : 'Görseli sürükleyip bırakın veya tıklayın'}
          </p>
          <p className="text-xs text-gray-500">
            {acceptedFileTypes.map(t => t.toUpperCase().replace('.', '')).join(', ')} - Max 50MB
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadSelector;
