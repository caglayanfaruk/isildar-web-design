import React, { useState, useEffect } from 'react';
import { Shield, X, Settings, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'isildar_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'isildar_cookie_preferences';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setVisible(false);
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
  };

  if (!visible) return null;

  const cookieCategories = [
    {
      key: 'necessary' as const,
      label: 'Zorunlu Cerezler',
      description: 'Sitenin duzgun calismasi icin gerekli cerezler. Devre disi birakilamaz.',
      locked: true
    },
    {
      key: 'functional' as const,
      label: 'Islevsel Cerezler',
      description: 'Dil tercihi ve kullanici ayarlari gibi ozellikleri hatirlar.'
    },
    {
      key: 'analytics' as const,
      label: 'Analitik Cerezler',
      description: 'Ziyaretci istatistiklerini anlamak icin kullanilir.'
    },
    {
      key: 'marketing' as const,
      label: 'Pazarlama Cerezleri',
      description: 'Kisisellestirilmis reklamlar gostermek icin kullanilir.'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-gray-950 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white">Cerez Politikasi</h3>
            </div>
            <button
              onClick={rejectAll}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Web sitemizde deneyiminizi iyilestirmek icin cerezler kullaniyoruz.
            Tercihlerinizi asagidan yonetebilirsiniz.{' '}
            <Link to="/cerez-politikasi" className="text-blue-400 hover:text-blue-300 underline">
              Cerez Politikasi
            </Link>
          </p>

          {showDetails && (
            <div className="space-y-2 mb-4 border-t border-white/10 pt-4">
              {cookieCategories.map((cat) => (
                <label
                  key={cat.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    preferences[cat.key]
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-white/5 bg-white/5'
                  } ${cat.locked ? 'opacity-75' : 'cursor-pointer hover:border-white/20'}`}
                >
                  <div className="flex-1 mr-3">
                    <span className="text-sm font-medium text-white">{cat.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={preferences[cat.key]}
                      disabled={cat.locked}
                      onChange={(e) => {
                        if (!cat.locked) {
                          setPreferences({ ...preferences, [cat.key]: e.target.checked });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${
                      preferences[cat.key] ? 'bg-blue-500' : 'bg-gray-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                        preferences[cat.key] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>{showDetails ? 'Gizle' : 'Tercihleri Yonet'}</span>
            </button>
            {showDetails && (
              <button
                onClick={acceptSelected}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white hover:bg-white/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Secilenleri Kabul Et</span>
              </button>
            )}
            <button
              onClick={acceptAll}
              className="flex-1 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-100 transition-all"
            >
              Tumunu Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
