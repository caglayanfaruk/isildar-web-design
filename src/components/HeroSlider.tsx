import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

interface SliderItem {
  id: string;
  image_id: string;
  title_tr: string;
  title_en: string;
  subtitle_tr: string;
  subtitle_en: string;
  accent_tr: string;
  accent_en: string;
  button_text_tr: string;
  button_text_en: string;
  button_link: string;
  sort_order: number;
  is_active: boolean;
  media: {
    url: string;
  };
}

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useTranslation();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadSlides();
  }, [currentLanguage]);

  const loadSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_items')
        .select(`
          *,
          media:image_id (
            url
          ),
          slider:slider_id (
            location,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('slider.location', 'homepage')
        .eq('slider.is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Çevirileri uygula
      const slidesWithTranslations = await Promise.all(
        (data || []).map(async (slide) => {
          // Türkçe metinleri al
          const { data: trTranslations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', 'tr')
            .in('translation_key', [
              `slider.${slide.id}.title`,
              `slider.${slide.id}.subtitle`,
              `slider.${slide.id}.button_text`
            ]);

          const trMap: any = {};
          trTranslations?.forEach(t => {
            const key = t.translation_key.split('.').pop();
            trMap[key] = t.translation_value || t.source_text;
          });

          // Fallback: Eğer translations tablosunda yoksa eski kolonlardan al
          const turkishTitle = trMap.title || slide.title_tr || '';
          const turkishSubtitle = trMap.subtitle || slide.subtitle_tr || '';
          const turkishButtonText = trMap.button_text || slide.button_text_tr || '';

          // Seçili dile çevir
          const [translatedTitle, translatedSubtitle, translatedButtonText] = await Promise.all([
            translate(turkishTitle, currentLanguage, `slider.${slide.id}.title`, { type: 'slider' }),
            translate(turkishSubtitle, currentLanguage, `slider.${slide.id}.subtitle`, { type: 'slider' }),
            translate(turkishButtonText, currentLanguage, `slider.${slide.id}.button_text`, { type: 'slider' })
          ]);

          return {
            ...slide,
            title_tr: translatedTitle,
            title_en: translatedTitle, // Artık dil seçimine göre dinamik
            subtitle_tr: translatedSubtitle,
            subtitle_en: translatedSubtitle,
            button_text_tr: translatedButtonText,
            button_text_en: translatedButtonText
          };
        })
      );

      setSlides(slidesWithTranslations);
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  if (loading) {
    return (
      <section className="relative h-[90vh] md:h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className="relative h-[90vh] md:h-screen overflow-hidden bg-black touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-2000 ease-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[15000ms] ease-out"
            style={{
              backgroundImage: `url(${slide.media.url})`,
              transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-ping"></div>
          </div>
        </div>
      ))}

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`transition-all duration-1200 ${
                  index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
                }`}
                style={{
                  position: 'absolute',
                  visibility: index === currentSlide ? 'visible' : 'hidden'
                }}
              >
                <div className="mb-4">
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white font-medium hover:bg-white/20 hover:scale-105 cursor-pointer group">
                    <span className="text-sm">
                      {currentLanguage === 'tr' ? slide.accent_tr : slide.accent_en}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                    <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                      {currentLanguage === 'tr' ? slide.title_tr : slide.title_en}
                    </span>
                  </h1>
                </div>

                <div className="mb-6">
                  <p className="text-sm lg:text-base text-gray-200 leading-relaxed max-w-2xl font-light">
                    {currentLanguage === 'tr' ? slide.subtitle_tr : slide.subtitle_en}
                  </p>
                </div>

                <div>
                  <a
                    href={slide.button_link}
                    className="group relative bg-white text-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-gray-100 transform transition-all duration-500 hover:scale-105 shadow-xl overflow-hidden inline-block"
                  >
                    <span className="relative z-10">
                      {currentLanguage === 'tr' ? slide.button_text_tr : slide.button_text_en}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-700 z-20">
                      {currentLanguage === 'tr' ? slide.button_text_tr : slide.button_text_en}
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`relative overflow-hidden rounded-full transition-all duration-700 hover:scale-125 group ${
              index === currentSlide
                ? 'w-12 h-3 bg-white shadow-2xl'
                : 'w-3 h-3 bg-white/30 hover:bg-white/60'
            }`}
          >
            {index === currentSlide && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-pulse"></div>
            )}
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
          </button>
        ))}
      </div>

      <div className="absolute bottom-12 left-8 text-white/60 animate-bounce group cursor-pointer">
        <div className="flex flex-col items-center space-y-2 group-hover:text-white transition-colors duration-300">
          <span className="text-xs font-medium">Ürünler</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-white via-gray-300 to-white transition-all duration-300 shadow-lg"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </section>
  );
};

export default HeroSlider;
