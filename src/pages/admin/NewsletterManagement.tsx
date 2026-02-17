import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Mail, Users, Download, Send, Eye, Filter, Search, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface NewsletterSubscription {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  ip_address?: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  open_rate?: number;
  click_rate?: number;
}

const NewsletterManagement = () => {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns' | 'analytics'>('subscribers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    subject: '',
    content: '',
    scheduled_at: ''
  });

  useEffect(() => {
    loadSubscriptions();
    loadCampaigns();
  }, [selectedStatus, searchTerm]);

  const loadSubscriptions = async () => {
    try {
      let query = supabase
        .from('newsletter_subscriptions')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Abonelikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      // Mock campaigns data - in real app this would come from database
      const mockCampaigns: EmailCampaign[] = [
        {
          id: '1',
          name: 'Ocak 2025 Ürün Bülteni',
          subject: 'Yeni LED Ürünlerimizi Keşfedin!',
          content: 'Bu ay çıkan yeni LED ürünlerimiz...',
          status: 'sent',
          sent_at: '2025-01-15T10:00:00Z',
          recipient_count: 1250,
          open_rate: 24.5,
          click_rate: 3.2
        },
        {
          id: '2',
          name: 'Kış Kampanyası',
          subject: '%20 İndirim Fırsatı!',
          content: 'Kış aylarında özel indirim...',
          status: 'scheduled',
          scheduled_at: '2025-01-20T09:00:00Z',
          recipient_count: 1180
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const handleSubscriptionStatusChange = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Abonelik durumu güncellendi');
      loadSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Bu aboneliği silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Abonelik silindi');
      loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleExportSubscriptions = () => {
    const csvContent = [
      ['Email', 'Durum', 'Abone Olma Tarihi', 'IP Adresi'].join(','),
      ...subscriptions.map(sub => [
        sub.email,
        sub.status,
        new Date(sub.subscribed_at).toLocaleDateString('tr-TR'),
        sub.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Aboneler CSV olarak indirildi');
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, this would save to database and send emails
      console.log('Campaign data:', campaignFormData);
      toast.success('Kampanya kaydedildi');
      resetCampaignForm();
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Kampanya kaydedilirken hata oluştu');
    }
  };

  const resetCampaignForm = () => {
    setCampaignFormData({
      name: '',
      subject: '',
      content: '',
      scheduled_at: ''
    });
    setEditingCampaignId(null);
    setShowCampaignForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'unsubscribed': return 'bg-red-100 text-red-800';
      case 'bounced': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'unsubscribed': return 'Abonelik İptal';
      case 'bounced': return 'Geri Döndü';
      default: return status;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'scheduled': return 'Zamanlandı';
      case 'sent': return 'Gönderildi';
      default: return status;
    }
  };

  const tabs = [
    { id: 'subscribers', name: 'Aboneler', icon: Users },
    { id: 'campaigns', name: 'Kampanyalar', icon: Mail },
    { id: 'analytics', name: 'Analitik', icon: TrendingUp }
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
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Yönetimi</h1>
          <p className="text-gray-600 mt-1">E-posta abonelerini ve kampanyalarını yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'subscribers' && (
            <button
              onClick={handleExportSubscriptions}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV İndir</span>
            </button>
          )}
          {activeTab === 'campaigns' && (
            <button
              onClick={() => setShowCampaignForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kampanya</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Abone</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Abone</p>
              <p className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <Mail className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Ay Yeni</p>
              <p className="text-2xl font-bold text-purple-600">
                {subscriptions.filter(s => 
                  new Date(s.subscribed_at).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kampanya Sayısı</p>
              <p className="text-2xl font-bold text-orange-600">{campaigns.length}</p>
            </div>
            <Send className="w-8 h-8 text-orange-500" />
          </div>
        </div>
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

      {/* Filters for Subscribers */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="unsubscribed">Abonelik İptal</option>
                <option value="bounced">Geri Döndü</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E-posta adresi ara..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Form */}
      {showCampaignForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingCampaignId ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
            </h2>
            <button
              onClick={resetCampaignForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCampaignSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanya Adı *
                </label>
                <input
                  type="text"
                  value={campaignFormData.name}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gönderim Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={campaignFormData.scheduled_at}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, scheduled_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta Konusu *
              </label>
              <input
                type="text"
                value={campaignFormData.subject}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta İçeriği *
              </label>
              <textarea
                value={campaignFormData.content}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, content: e.target.value })}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E-posta içeriğinizi buraya yazın..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetCampaignForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {activeTab === 'subscribers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abone Olma Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Adresi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscription.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={subscription.status}
                        onChange={(e) => handleSubscriptionStatusChange(subscription.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${getStatusColor(subscription.status)}`}
                      >
                        <option value="active">Aktif</option>
                        <option value="unsubscribed">Abonelik İptal</option>
                        <option value="bounced">Geri Döndü</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.subscribed_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kampanya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alıcı Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performans
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
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{campaign.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                        {getCampaignStatusText(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.recipient_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.open_rate && campaign.click_rate ? (
                        <div>
                          <div>📖 %{campaign.open_rate} açılma</div>
                          <div>🖱️ %{campaign.click_rate} tıklama</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Henüz veri yok</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.sent_at ? (
                        <div>
                          <div>Gönderildi</div>
                          <div>{new Date(campaign.sent_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                      ) : campaign.scheduled_at ? (
                        <div>
                          <div>Zamanlandı</div>
                          <div>{new Date(campaign.scheduled_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                      ) : (
                        'Taslak'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Abone Büyümesi</h4>
                <div className="h-32 bg-white rounded border flex items-center justify-center">
                  <span className="text-gray-400">Grafik yakında eklenecek</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Kampanya Performansı</h4>
                <div className="h-32 bg-white rounded border flex items-center justify-center">
                  <span className="text-gray-400">Grafik yakında eklenecek</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterManagement;