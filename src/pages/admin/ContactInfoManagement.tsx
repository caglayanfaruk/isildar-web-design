import React, { useState, useEffect } from 'react';
import { Save, Phone, Mail, MapPin, Clock, Globe, Fan as Fax, CreditCard as Edit, Plus, Trash2, X } from 'lucide-react';
import { supabase, Setting } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ContactInfo {
  id?: string;
  whatsapp_number: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  working_hours: {
    monday_friday: string;
    saturday: string;
    sunday: string;
  };
  social_media: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  map_coordinates: {
    latitude: string;
    longitude: string;
  };
  additional_phones: string[];
  additional_emails: string[];
}

const ContactInfoManagement = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    whatsapp_number: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    working_hours: {
      monday_friday: '08:00 - 18:00',
      saturday: '09:00 - 16:00',
      sunday: 'Kapalı'
    },
    social_media: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    },
    map_coordinates: {
      latitude: '',
      longitude: ''
    },
    additional_phones: [],
    additional_emails: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'social' | 'map'>('basic');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
      toast.error('İletişim bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, ...updateData } = contactInfo;

      if (id) {
        const { error } = await supabase
          .from('contact_info')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_info')
          .insert([updateData]);

        if (error) throw error;
      }

      toast.success('İletişim bilgileri kaydedildi');
      await loadContactInfo();
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addPhone = () => {
    if (newPhone.trim()) {
      setContactInfo({
        ...contactInfo,
        additional_phones: [...contactInfo.additional_phones, newPhone.trim()]
      });
      setNewPhone('');
    }
  };

  const removePhone = (index: number) => {
    setContactInfo({
      ...contactInfo,
      additional_phones: contactInfo.additional_phones.filter((_, i) => i !== index)
    });
  };

  const addEmail = () => {
    if (newEmail.trim()) {
      setContactInfo({
        ...contactInfo,
        additional_emails: [...contactInfo.additional_emails, newEmail.trim()]
      });
      setNewEmail('');
    }
  };

  const removeEmail = (index: number) => {
    setContactInfo({
      ...contactInfo,
      additional_emails: contactInfo.additional_emails.filter((_, i) => i !== index)
    });
  };

  const tabs = [
    { id: 'basic', name: 'Temel Bilgiler', icon: Phone },
    { id: 'hours', name: 'Çalışma Saatleri', icon: Clock },
    { id: 'social', name: 'Sosyal Medya', icon: Globe },
    { id: 'map', name: 'Harita', icon: MapPin }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">İletişim Bilgileri</h1>
          <p className="text-gray-600 mt-1">Şirket iletişim bilgilerini yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Numarası
                </label>
                <input
                  type="tel"
                  value={contactInfo.whatsapp_number}
                  onChange={(e) => setContactInfo({ ...contactInfo, whatsapp_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="905055555555"
                />
                <p className="text-xs text-gray-500 mt-1">Örnek: 905055555555 (ülke kodu ile, + ve boşluk olmadan)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ana Telefon *
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+90 212 549 53 93"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faks
                </label>
                <input
                  type="tel"
                  value={contactInfo.fax}
                  onChange={(e) => setContactInfo({ ...contactInfo, fax: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+90 212 549 53 96"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ana E-posta *
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@isildar.eu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={contactInfo.website}
                  onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.isildar.eu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres *
              </label>
              <textarea
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="İkitelli Organize San. Böl. İPKAŞ San. Sit. 3. Etap B Blok No:3 İkitelli - Küçükçekmece / İSTANBUL"
              />
            </div>

            {/* Additional Phones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ek Telefonlar
              </label>
              <div className="space-y-2">
                {contactInfo.additional_phones.map((phone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const newPhones = [...contactInfo.additional_phones];
                        newPhones[index] = e.target.value;
                        setContactInfo({ ...contactInfo, additional_phones: newPhones });
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removePhone(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Yeni telefon numarası"
                  />
                  <button
                    onClick={addPhone}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Emails */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ek E-postalar
              </label>
              <div className="space-y-2">
                {contactInfo.additional_emails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...contactInfo.additional_emails];
                        newEmails[index] = e.target.value;
                        setContactInfo({ ...contactInfo, additional_emails: newEmails });
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeEmail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Yeni e-posta adresi"
                  />
                  <button
                    onClick={addEmail}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Çalışma Saatleri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pazartesi - Cuma
                </label>
                <input
                  type="text"
                  value={contactInfo.working_hours.monday_friday}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    working_hours: {
                      ...contactInfo.working_hours,
                      monday_friday: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08:00 - 18:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cumartesi
                </label>
                <input
                  type="text"
                  value={contactInfo.working_hours.saturday}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    working_hours: {
                      ...contactInfo.working_hours,
                      saturday: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09:00 - 16:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pazar
                </label>
                <input
                  type="text"
                  value={contactInfo.working_hours.sunday}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    working_hours: {
                      ...contactInfo.working_hours,
                      sunday: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kapalı"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Sosyal Medya Hesapları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={contactInfo.social_media.facebook}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    social_media: {
                      ...contactInfo.social_media,
                      facebook: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://facebook.com/isildar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={contactInfo.social_media.twitter}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    social_media: {
                      ...contactInfo.social_media,
                      twitter: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://twitter.com/isildar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={contactInfo.social_media.instagram}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    social_media: {
                      ...contactInfo.social_media,
                      instagram: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://instagram.com/isildar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={contactInfo.social_media.linkedin}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    social_media: {
                      ...contactInfo.social_media,
                      linkedin: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/company/isildar"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  value={contactInfo.social_media.youtube}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    social_media: {
                      ...contactInfo.social_media,
                      youtube: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/@isildar"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Harita Koordinatları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enlem (Latitude)
                </label>
                <input
                  type="text"
                  value={contactInfo.map_coordinates.latitude}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    map_coordinates: {
                      ...contactInfo.map_coordinates,
                      latitude: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="41.0082"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boylam (Longitude)
                </label>
                <input
                  type="text"
                  value={contactInfo.map_coordinates.longitude}
                  onChange={(e) => setContactInfo({
                    ...contactInfo,
                    map_coordinates: {
                      ...contactInfo.map_coordinates,
                      longitude: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="28.9784"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Koordinat Bulma İpuçları</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Google Maps'te konumunuzu bulun</li>
                <li>• Konuma sağ tıklayın</li>
                <li>• Koordinatları kopyalayın</li>
                <li>• İlk sayı enlem, ikinci sayı boylamdır</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfoManagement;