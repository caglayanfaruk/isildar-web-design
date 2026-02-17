import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, User, Building, MessageSquare, CheckCircle, Globe, Fan as Fax } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast.error('Lütfen robot olmadığınızı doğrulayın.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { data: contactMessage, error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          subject: formData.subject,
          message: formData.message,
          status: 'unread'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Show success message
      setIsSubmitted(true);
      toast.success('Mesajınız başarıyla gönderildi!');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
      setIsVerified(false);

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Mesaj gönderilirken hata oluştu. Lütfen tekrar deneyin.');
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
                {t('ui.contact.title', 'Bizimle İletişime Geçin')}
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t('ui.contact.subtitle', 'Sorularınız, önerileriniz veya talepleriniz için bize ulaşabilirsiniz. Size en kısa sürede geri dönüş yapacağız.')}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">{t('ui.contact.info_title', 'İletişim Bilgileri')}</h2>
              
              <div className="space-y-6">
                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500/20 p-3 rounded-xl">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{t('ui.contact.address', 'Adres')}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        İkitelli Organize San. Böl.<br />
                        İPKAŞ San. Sit. 3. Etap B Blok No:3<br />
                        İkitelli - Küçükçekmece / İSTANBUL
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-500/20 p-3 rounded-xl">
                      <Phone className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{t('ui.contact.phone', 'Telefon Numaranız')}</h3>
                      <p className="text-sm text-gray-300">+90 0212 549 53 93</p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-500/20 p-3 rounded-xl">
                      <Fax className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Faks</h3>
                      <p className="text-sm text-gray-300">+90 0212 549 53 96</p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-500/20 p-3 rounded-xl">
                      <Mail className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{t('ui.contact.email', 'E-posta')}</h3>
                      <p className="text-sm text-gray-300">info@isildar.eu</p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-500/20 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{t('ui.contact.working_hours', 'Çalışma Saatleri')}</h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p>Pazartesi - Cuma: 08:00 - 18:00</p>
                        <p>Cumartesi: 09:00 - 16:00</p>
                        <p>Pazar: Kapalı</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <h3 className="text-xl font-bold mb-4 text-white">Konum</h3>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3007.1744353769027!2d28.796274876555064!3d41.08703521457091!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caaf64f9954a9f%3A0xd2560a5d6fa596ab!2zScWfxLFsZGFyIFBsYXN0aWsgdmUgQXlkxLFubGF0bWEgQS7Fni4!5e0!3m2!1str!2str!4v1766480615916!5m2!1str!2str"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">{t('ui.contact.form_title', 'Mesaj Gönderin')}</h2>
              
              {isSubmitted && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ui.contact.name', 'Adınız Soyadınız')} *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                        placeholder={t('ui.contact.name', 'Adınız Soyadınız')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ui.contact.email', 'E-posta Adresiniz')} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ui.contact.phone', 'Telefon Numaranız')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('ui.contact.company', 'Şirket Adı')}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300"
                        placeholder={t('ui.contact.company', 'Şirket Adı')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('ui.contact.subject', 'Konu')} *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    style={{ color: formData.subject ? 'white' : 'rgb(156, 163, 175)' }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 [&>option]:text-white [&>option]:bg-gray-800"
                  >
                    <option value="" style={{ color: 'rgb(156, 163, 175)' }}>Konu seçiniz</option>
                    <option value="genel" style={{ color: 'white' }}>Genel Bilgi</option>
                    <option value="urun" style={{ color: 'white' }}>Ürün Bilgisi</option>
                    <option value="teklif" style={{ color: 'white' }}>Teklif Talebi</option>
                    <option value="destek" style={{ color: 'white' }}>Teknik Destek</option>
                    <option value="bayi" style={{ color: 'white' }}>Bayilik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('ui.contact.message', 'Mesajınız')} *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 resize-none text-white placeholder:text-gray-400"
                      placeholder={t('ui.contact.message', 'Mesajınız')}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="verify"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50"
                  />
                  <label htmlFor="verify" className="text-sm text-gray-300 cursor-pointer">
                    Robot olmadığımı onaylıyorum
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isVerified}
                  className="w-full bg-white text-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  <span>{isSubmitting ? t('ui.contact.sending', 'Gönderiliyor...') : t('ui.contact.send', 'Gönder')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="container mx-auto px-6 mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-gray-800/50 transition-all duration-300 group">
              <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">47 Ülke</h3>
              <p className="text-sm text-gray-300">İhracat yaptığımız ülke sayısı</p>
            </div>

            <div className="text-center p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-gray-800/50 transition-all duration-300 group">
              <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">24 Saat</h3>
              <p className="text-sm text-gray-300">İçinde yanıt verme süresi</p>
            </div>

            <div className="text-center p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-gray-800/50 transition-all duration-300 group">
              <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">%100</h3>
              <p className="text-sm text-gray-300">Müşteri memnuniyeti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;