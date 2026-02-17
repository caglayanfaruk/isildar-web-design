import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Search, Filter, Mail, Phone, Building, Calendar, Package, FileText, Download, Reply, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_name?: string;
  project_address?: string;
  deadline?: string;
  budget_range?: string;
  description: string;
  status: string;
  items: any[];
  attachments: any[];
  ip_address?: string;
  user_agent?: string;
  responded_at?: string;
  responded_by?: string;
  created_at: string;
}

const QuoteRequestsManagement = () => {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [responseText, setResponseText] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [selectedStatus, searchTerm]);

  const loadRequests = async () => {
    try {
      let query = supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Teklif talepleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu teklif talebini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Teklif talebi silindi');
      loadRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ 
          status: 'responded',
          responded_at: new Date().toISOString(),
          responded_by: '00000000-0000-0000-0000-000000000000' // Will be replaced with actual user ID
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Here you would typically send an email with the quote
      console.log('Quote response sent:', {
        to: selectedRequest.email,
        subject: `Teklif: ${selectedRequest.project_name || 'Aydınlatma Projesi'}`,
        message: responseText
      });

      toast.success('Teklif yanıtı gönderildi');
      setShowResponseModal(false);
      setResponseText('');
      loadRequests();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Yanıt gönderilirken hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'İşlemde';
      case 'responded': return 'Yanıtlandı';
      case 'rejected': return 'Reddedildi';
      case 'archived': return 'Arşivlendi';
      default: return status;
    }
  };

  const getBudgetText = (budget: string) => {
    switch (budget) {
      case '0-10000': return '0 - 10.000 TL';
      case '10000-50000': return '10.000 - 50.000 TL';
      case '50000-100000': return '50.000 - 100.000 TL';
      case '100000+': return '100.000 TL+';
      default: return budget || 'Belirtilmemiş';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Teklif Talepleri</h1>
          <p className="text-gray-600 mt-1">Gelen teklif taleplerini yönetin</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>{requests.filter(r => r.status === 'pending').length} Bekliyor</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>{requests.filter(r => r.status === 'in_progress').length} İşlemde</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{requests.filter(r => r.status === 'responded').length} Yanıtlandı</span>
          </div>
        </div>
      </div>

      {/* Filters */}
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
              <option value="pending">Bekliyor</option>
              <option value="in_progress">İşlemde</option>
              <option value="responded">Yanıtlandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="İsim, email veya proje ara..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talep Eden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bütçe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
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
                {requests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.email}
                        </div>
                        {request.company && (
                          <div className="text-xs text-gray-400">
                            {request.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.project_name || 'Proje adı belirtilmemiş'}
                      </div>
                      {request.deadline && (
                        <div className="text-xs text-gray-500">
                          Teslim: {new Date(request.deadline).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getBudgetText(request.budget_range || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                            setShowResponseModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Teklif Gönder"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(request.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Detail */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          {selectedRequest ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Teklif Detayı</h3>
                <select
                  value={selectedRequest.status}
                  onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="in_progress">İşlemde</option>
                  <option value="responded">Yanıtlandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="archived">Arşivlendi</option>
                </select>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">İletişim Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{selectedRequest.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedRequest.email}`} className="text-sm text-blue-600 hover:underline">
                      {selectedRequest.email}
                    </a>
                  </div>
                  {selectedRequest.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedRequest.phone}`} className="text-sm text-blue-600 hover:underline">
                        {selectedRequest.phone}
                      </a>
                    </div>
                  )}
                  {selectedRequest.company && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedRequest.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Proje Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedRequest.project_name && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Proje Adı:</span>
                      <p className="text-sm text-gray-900">{selectedRequest.project_name}</p>
                    </div>
                  )}
                  {selectedRequest.project_address && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Adres:</span>
                      <p className="text-sm text-gray-900">{selectedRequest.project_address}</p>
                    </div>
                  )}
                  {selectedRequest.deadline && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Teslim Tarihi:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedRequest.deadline).toLocaleDateString('tr-TR')}</p>
                    </div>
                  )}
                  {selectedRequest.budget_range && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Bütçe:</span>
                      <p className="text-sm text-gray-900">{getBudgetText(selectedRequest.budget_range)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Proje Açıklaması</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Requested Items */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Talep Edilen Ürünler</h4>
                  <div className="space-y-2">
                    {selectedRequest.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Kategori:</span>
                            <p className="text-gray-900">{item.category || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Ürün:</span>
                            <p className="text-gray-900">{item.product || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Adet:</span>
                            <p className="text-gray-900">{item.quantity || 1}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-500">Notlar:</span>
                            <p className="text-sm text-gray-700">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ekler</h4>
                  <div className="space-y-2">
                    {selectedRequest.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({attachment.size})</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowResponseModal(true)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>Teklif Gönder</span>
                </button>
                <button
                  onClick={() => handleStatusChange(selectedRequest.id, 'archived')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Arşivle
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Detayları görmek için bir teklif talebi seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Teklif Gönder</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Kime:</strong> {selectedRequest.email}
                </div>
                <div>
                  <strong>Proje:</strong> {selectedRequest.project_name || 'Aydınlatma Projesi'}
                </div>
                <div>
                  <strong>Bütçe:</strong> {getBudgetText(selectedRequest.budget_range || '')}
                </div>
                <div>
                  <strong>Teslim:</strong> {selectedRequest.deadline ? new Date(selectedRequest.deadline).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teklif Detayları
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sayın [Müşteri Adı],

Teklif talebiniz için teşekkür ederiz. Projeniz için hazırladığımız teklif aşağıdaki gibidir:

[Ürün listesi ve fiyatlar]

Toplam Tutar: [Tutar]
Teslim Süresi: [Süre]
Garanti: 2 yıl

Herhangi bir sorunuz olursa lütfen bizimle iletişime geçin.

Saygılarımızla,
IŞILDAR Aydınlatma"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleResponse}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Teklif Gönder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequestsManagement;