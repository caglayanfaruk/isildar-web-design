import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Search, Filter, Mail, Phone, Building, Calendar, MessageSquare, Reply, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: string;
  ip_address?: string;
  user_agent?: string;
  replied_at?: string;
  replied_by?: string;
  created_at: string;
}

const ContactMessagesManagement = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [selectedStatus, searchTerm]);

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Mesajlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Mesaj silindi');
      loadMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      // Update message status
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status: 'replied',
          replied_at: new Date().toISOString(),
          replied_by: '00000000-0000-0000-0000-000000000000' // Will be replaced with actual user ID
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // Here you would typically send an email
      console.log('Reply sent:', {
        to: selectedMessage.email,
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText
      });

      toast.success('Yanıt gönderildi');
      setShowReplyModal(false);
      setReplyText('');
      loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Yanıt gönderilirken hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unread': return 'Okunmadı';
      case 'read': return 'Okundu';
      case 'replied': return 'Yanıtlandı';
      case 'archived': return 'Arşivlendi';
      default: return status;
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
          <h1 className="text-2xl font-bold text-gray-900">İletişim Mesajları</h1>
          <p className="text-gray-600 mt-1">Gelen mesajları yönetin</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>{messages.filter(m => m.status === 'unread').length} Okunmadı</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{messages.filter(m => m.status === 'replied').length} Yanıtlandı</span>
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
              <option value="unread">Okunmadı</option>
              <option value="read">Okundu</option>
              <option value="replied">Yanıtlandı</option>
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
                placeholder="İsim, email veya konu ara..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gönderen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konu
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
                {messages.map((message) => (
                  <tr 
                    key={message.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === 'unread') {
                        handleStatusChange(message.id, 'read');
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {message.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.email}
                        </div>
                        {message.company && (
                          <div className="text-xs text-gray-400">
                            {message.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {message.subject || 'Konu belirtilmemiş'}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {message.message.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusText(message.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage(message);
                            setShowReplyModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Yanıtla"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(message.id);
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

        {/* Message Detail */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mesaj Detayı</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unread">Okunmadı</option>
                    <option value="read">Okundu</option>
                    <option value="replied">Yanıtlandı</option>
                    <option value="archived">Arşivlendi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{selectedMessage.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedMessage.phone}`} className="text-sm text-blue-600 hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
                {selectedMessage.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedMessage.company}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>

              {selectedMessage.subject && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Konu:</h4>
                  <p className="text-sm text-gray-900">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mesaj:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>Yanıtla</span>
                </button>
                <button
                  onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Arşivle
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Detayları görmek için bir mesaj seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mesajı Yanıtla</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Kime:</strong> {selectedMessage.email}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Konu:</strong> Re: {selectedMessage.subject || 'İletişim Mesajı'}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yanıt Mesajı
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yanıtınızı buraya yazın..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleReply}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Yanıt Gönder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessagesManagement;