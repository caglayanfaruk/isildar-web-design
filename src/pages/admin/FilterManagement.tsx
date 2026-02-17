import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';

const FilterManagement = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/admin/attributes');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Filtre Yönetimi Birleştirildi
            </h2>
            <p className="text-gray-600 mb-4">
              Filtre yönetimi sistemi, Özellik Yönetimi (Attributes) ile birleştirildi.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Ne Değişti?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Filtreler ve özellikler artık tek bir sistemde yönetiliyor</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Veri tekrarı ortadan kaldırıldı</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Daha basit ve tutarlı yönetim deneyimi</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Tüm eski verileriniz korundu ve otomatik olarak aktarıldı</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            3 saniye içinde yönlendiriliyorsunuz...
          </p>
          <button
            onClick={() => navigate('/admin/attributes')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            <span>Özellik Yönetimine Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterManagement;
