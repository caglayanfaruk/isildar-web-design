import React, { useState, useEffect } from 'react';
import { Save, Mail, Server, TestTube, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SMTPSettings {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  use_ssl: boolean;
  is_active: boolean;
}

const SMTPManagement = () => {
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'IŞILDAR Aydınlatma',
    use_tls: true,
    use_ssl: false,
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'test'>('settings');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSMTPSettings();
  }, []);

  const loadSMTPSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSMTPSettings(data);
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
      toast.error('SMTP ayarları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMTP = async () => {
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.from_email) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      if (smtpSettings.id) {
        // Update existing
        const { error } = await supabase
          .from('smtp_settings')
          .update({
            host: smtpSettings.host,
            port: smtpSettings.port,
            username: smtpSettings.username,
            password: smtpSettings.password,
            from_email: smtpSettings.from_email,
            from_name: smtpSettings.from_name,
            use_tls: smtpSettings.use_tls,
            use_ssl: smtpSettings.use_ssl,
            is_active: smtpSettings.is_active
          })
          .eq('id', smtpSettings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('smtp_settings')
          .insert([smtpSettings])
          .select()
          .single();

        if (error) throw error;
        if (data) setSMTPSettings(data);
      }

      toast.success('SMTP ayarları kaydedildi');
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Test e-posta adresi girin');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Call edge function to send test email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: 'IŞILDAR - Test E-postası',
          text: 'Bu bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor!',
          html: '<h1>Test E-postası</h1><p>Bu bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor!</p>'
        }
      });

      if (error) throw error;

      setTestResult({
        success: true,
        message: 'Test e-postası başarıyla gönderildi!'
      });
      toast.success('Test e-postası gönderildi');
    } catch (error) {
      console.error('Error testing email:', error);
      setTestResult({
        success: false,
        message: 'SMTP bağlantısı başarısız. Ayarları kontrol edin.'
      });
      toast.error('Test başarısız');
    } finally {
      setTesting(false);
    }
  };

  const tabs = [
    { id: 'settings', name: 'SMTP Ayarları', icon: Server },
    { id: 'test', name: 'Test & Doğrulama', icon: TestTube }
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
          <h1 className="text-2xl font-bold text-gray-900">SMTP Ayarları</h1>
          <p className="text-gray-600 mt-1">E-posta gönderim ayarlarını yönetin</p>
        </div>
        {activeTab === 'settings' && (
          <button
            onClick={handleSaveSMTP}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        )}
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
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="space-y-6">
            {/* SMTP Server Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sunucu Ayarları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Sunucusu *
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.host}
                    onChange={(e) => setSMTPSettings({ ...smtpSettings, host: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={smtpSettings.port}
                    onChange={(e) => setSMTPSettings({ ...smtpSettings, port: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.username}
                    onChange={(e) => setSMTPSettings({ ...smtpSettings, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpSettings.password}
                      onChange={(e) => setSMTPSettings({ ...smtpSettings, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-8">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={smtpSettings.use_tls}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, use_tls: e.target.checked, use_ssl: e.target.checked ? false : smtpSettings.use_ssl })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">TLS Kullan</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={smtpSettings.use_ssl}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, use_ssl: e.target.checked, use_tls: e.target.checked ? false : smtpSettings.use_tls })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">SSL Kullan</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">E-posta Ayarları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gönderen E-posta *
                  </label>
                  <input
                    type="email"
                    value={smtpSettings.from_email}
                    onChange={(e) => setSMTPSettings({ ...smtpSettings, from_email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@isildar.eu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gönderen Adı *
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.from_name}
                    onChange={(e) => setSMTPSettings({ ...smtpSettings, from_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IŞILDAR Aydınlatma"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpSettings.is_active}
                      onChange={(e) => setSMTPSettings({ ...smtpSettings, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SMTP'yi etkinleştir</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SMTP Bağlantı Testi</h3>
              <p className="text-sm text-gray-600 mb-4">
                SMTP ayarlarınızın doğru çalıştığını test etmek için bir test e-postası gönderin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test E-posta Adresi *
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="test@example.com"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTestEmail}
                  disabled={testing || !testEmail.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testing ? 'Test Ediliyor...' : 'Test E-postası Gönder'}</span>
                </button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* SMTP Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Mevcut SMTP Durumu</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Sunucu:</span>
                  <span className="ml-2 font-medium">{smtpSettings.host || 'Belirtilmemiş'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Port:</span>
                  <span className="ml-2 font-medium">{smtpSettings.port}</span>
                </div>
                <div>
                  <span className="text-gray-500">Şifreleme:</span>
                  <span className="ml-2 font-medium">
                    {smtpSettings.use_tls ? 'TLS' : smtpSettings.use_ssl ? 'SSL' : 'Yok'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Durum:</span>
                  <span className={`ml-2 font-medium ${
                    smtpSettings.is_active ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {smtpSettings.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common SMTP Providers */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popüler SMTP Sağlayıcıları</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Gmail</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Sunucu: smtp.gmail.com</p>
              <p>Port: 587</p>
              <p>Şifreleme: TLS</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Outlook</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Sunucu: smtp-mail.outlook.com</p>
              <p>Port: 587</p>
              <p>Şifreleme: TLS</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Yandex</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Sunucu: smtp.yandex.com</p>
              <p>Port: 587</p>
              <p>Şifreleme: TLS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMTPManagement;
