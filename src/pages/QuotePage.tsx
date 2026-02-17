import React, { useState } from 'react';
import {
  FileText,
  Upload,
  User,
  Send,
  CheckCircle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

const QuotePage = () => {
  const { currentLanguage, t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    description: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert('Lütfen robot olmadığınızı doğrulayın.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dosyaları yükle
      const uploadedFiles: any[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('quote-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue;
          }

          uploadedFiles.push({
            name: file.name,
            path: filePath,
            size: file.size,
            type: file.type
          });
        }
      }

      // Teklif talebini veritabanına kaydet
      const { error: quoteError } = await supabase
        .from('quote_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          project_address: formData.address,
          description: formData.description,
          items: null,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
          status: 'pending'
        });

      if (quoteError) throw quoteError;

      setIsSubmitted(true);

      // Formu temizle
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        description: ''
      });
      setAttachments([]);
      setIsVerified(false);

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      alert('Teklif gönderilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

      const validFiles = files.filter(file => {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = allowedTypes.includes(file.type);
        const isValidExt = allowedExtensions.includes(fileExt);

        if (!isValidType && !isValidExt) {
          alert(`"${file.name}" dosyası desteklenmiyor. Sadece PDF, Excel, Word ve resim dosyaları yükleyebilirsiniz.`);
          return false;
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          alert(`"${file.name}" dosyası çok büyük. Maksimum 10MB yükleyebilirsiniz.`);
          return false;
        }

        return true;
      });

      setAttachments([...attachments, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Teklif Talebi
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Aydınlatma projeleriniz için detaylı teklif alın. 
              Uzman ekibimiz size özel çözümler sunacak.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            {isSubmitted && (
              <div className="mb-8 p-6 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-green-300 font-semibold">Teklif talebiniz alındı!</h3>
                  <p className="text-green-300/80 text-sm">24 saat içinde size detaylı teklif göndereceğiz.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  Kişisel Bilgiler
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('ui.contact.name', 'Adınız Soyadınız')} *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                      placeholder={t('ui.contact.name', 'Adınız Soyadınız')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('ui.contact.email', 'E-posta Adresiniz')} *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('ui.contact.phone', 'Telefon Numaranız')} *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('ui.contact.company', 'Şirket Adı')}</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                      placeholder={t('ui.contact.company', 'Şirket Adı')}
                    />
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Proje Açıklaması *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 resize-none"
                  placeholder="Projenizi detaylı olarak açıklayın. Hangi alanlar için aydınlatma ihtiyacınız var? Özel istekleriniz neler?"
                />
              </div>

              {/* File Upload */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Upload className="w-6 h-6 mr-2" />
                  Dosya Ekleri
                </h2>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-all duration-300">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Ürün listesi, plan, çizim veya referans dosyalarını yükleyin</p>
                  <p className="text-gray-400 text-sm mb-4">PDF, Excel, Word, JPG, PNG (Max 10MB)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 inline-flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Dosya Seç</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-2">PDF, Excel, Word, JPG, PNG (Max 10MB)</p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  id="verify-quote"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50"
                />
                <label htmlFor="verify-quote" className="text-sm text-gray-300 cursor-pointer">
                  Robot olmadığımı onaylıyorum
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isVerified}
                className="w-full bg-white text-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span>{isSubmitting ? 'Gönderiliyor...' : t('ui.quote.submit', 'Teklif Talebi Gönder')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePage;