import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { supabase, Translation, Language } from '../lib/supabase';
import { translate } from '../services/unifiedTranslationService';

interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  translate: (text: string, key: string) => Promise<string>;
  languages: Language[];
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const CACHE_VERSION = '2.8.4';
const CACHE_KEY = `translation_cache_v${CACHE_VERSION}`;
const translationCache = new Map<string, Record<string, string>>();

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'tr';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedVersion = localStorage.getItem('translationCacheVersion');
    if (storedVersion !== CACHE_VERSION) {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      translationCache.clear();
      localStorage.clear();
      localStorage.setItem('translationCacheVersion', CACHE_VERSION);
      if (savedLanguage) {
        localStorage.setItem('selectedLanguage', savedLanguage);
      }
    }
    loadLanguages();
  }, []);

  useEffect(() => {
    loadTranslations();
  }, [currentLanguage]);

  const loadLanguages = async () => {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (data && !error) {
      setLanguages(data);
      const savedLang = localStorage.getItem('selectedLanguage');
      if (!savedLang) {
        const defaultLang = data.find(lang => lang.is_default);
        if (defaultLang) {
          setCurrentLanguageState(defaultLang.code);
          localStorage.setItem('selectedLanguage', defaultLang.code);
        }
      }
    }
  };

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            text,
            targetLanguage: targetLang,
            sourceLanguage: 'tr'
          })
        }
      );

      if (!response.ok) {
        console.error('Translation failed:', response.status);
        return text;
      }

      const data = await response.json();
      if (data.success && data.translations) {
        return data.translations.translatedText;
      }
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const loadTranslations = async () => {
    setIsLoading(true);

    console.log('[Translation] Loading translations for:', currentLanguage);

    let allTranslations: Translation[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('language_code', currentLanguage)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('[Translation] Load error:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        allTranslations = [...allTranslations, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log('[Translation] Loaded', allTranslations.length, 'translations for', currentLanguage);

    const translationMap: Record<string, string> = {};
    allTranslations.forEach((translation: Translation) => {
      translationMap[translation.translation_key] = translation.translation_value;
    });

    console.log('[Translation] Sample keys:', Object.keys(translationMap).slice(0, 5));

    translationCache.set(currentLanguage, translationMap);
    setTranslations(translationMap);
    setIsLoading(false);
  };

  const setCurrentLanguage = useCallback((lang: string) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('selectedLanguage', lang);
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  }, [translations]);

  const translateDynamic = useCallback(async (text: string, key: string): Promise<string> => {
    return translate(text, currentLanguage, key, { type: 'dynamic' });
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    setCurrentLanguage,
    t,
    translate: translateDynamic,
    languages,
    isLoading
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
