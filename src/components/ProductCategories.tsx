import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Zap, 
  Sparkles, 
  Factory, 
  TreePine, 
  ArrowRight,
  Lightbulb,
  Shield,
  Cpu,
  Sun,
  Flame,
  Car,
  Waves
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

const ProductCategories = () => {
  const navigate = useNavigate();
  const { currentLanguage, t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [currentLanguage]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products:products(count)
        `)
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order');

      if (error) throw error;

      // Load translations and images for each category
      const categoriesWithTranslations = await Promise.all(
        (data || []).map(async (category) => {
          // Türkçe kategori adını al
          const { data: trTranslation } = await supabase
            .from('translations')
            .select('translation_value, source_text')
            .eq('language_code', 'tr')
            .eq('translation_key', `category.${category.slug}.name`)
            .maybeSingle();

          const turkishName = trTranslation?.translation_value || trTranslation?.source_text || category.slug;

          // Seçili dilde çevir
          const translatedName = await translate(
            turkishName,
            currentLanguage,
            `category.${category.slug}.name`,
            { type: 'category' }
          );

          // Get category image
          let imageUrl = null;
          if (category.image_id) {
            const { data: media } = await supabase
              .from('media')
              .select('url')
              .eq('id', category.image_id)
              .maybeSingle();

            imageUrl = media?.url;
          }

          // Get product count using junction table
          const { data: productCategories } = await supabase
            .from('product_categories')
            .select('product_id')
            .eq('category_id', category.id);

          const productCount = productCategories?.length || 0;

          return {
            ...category,
            name: translatedName,
            product_count: productCount,
            image_url: imageUrl
          };
        })
      );

      setCategories(categoriesWithTranslations);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Icon mapping for categories
  const getIconComponent = (iconString: string) => {
    const iconMap: any = {
      '⚡': Zap,
      '🏭': Factory,
      '💡': Lightbulb,
      '✨': Sparkles,
      '☀️': Sun,
      '🏢': Building,
      '🌊': Waves,
      '🌳': TreePine,
      '🤖': Cpu,
      '🛡️': Shield,
      '🔧': Car
    };
    return iconMap[iconString] || Lightbulb;
  };

  // Gradient mapping for categories
  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500/20 to-cyan-500/20',
      'from-purple-500/20 to-pink-500/20',
      'from-green-500/20 to-emerald-500/20',
      'from-indigo-500/20 to-blue-500/20',
      'from-yellow-500/20 to-orange-500/20',
      'from-rose-500/20 to-pink-500/20',
      'from-red-500/20 to-orange-500/20',
      'from-teal-500/20 to-cyan-500/20',
      'from-violet-500/20 to-purple-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-gray-500/20 to-slate-500/20'
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <section id="products" className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-6 relative">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">t('key', 'Kategoriler yükleniyor...')</p>
          </div>
        </div>
      </section>
    );
  }

  const getGridCols = (count: number) => {
    if (count === 1) return 'lg:grid-cols-1';
    if (count === 2) return 'lg:grid-cols-2';
    if (count === 3) return 'lg:grid-cols-3';
    if (count === 4) return 'lg:grid-cols-4';
    return 'lg:grid-cols-5';
  };

  return (
    <section id="products" className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white mb-8 hover:bg-white/15 transition-all duration-300 group cursor-pointer">
            <Lightbulb className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            <span className="font-medium">{t('ui.homepage.categories_title', 'Ürün Kategorilerimiz')}</span>
          </div>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('ui.homepage.categories_subtitle', 'Farklı sektörlere özel aydınlatma çözümlerimizi keşfedin')}
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols(categories.length)} gap-8`}>
          {categories.map((category, index) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <div
                key={category.id}
                className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-gray-800/70 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl border border-white/10 hover:border-white/20 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/kategori/${category.slug}`)}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(index)} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/3 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative overflow-hidden rounded-t-2xl" >
                  <img
                    src={category.image_url || `https://www.kartmix.com/tema/genel/uploads/urunler/resim-yok.png`}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[calc(100%-2px)] bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-300" />
                </div>
                
                <div className="relative p-6">
                  <h3 className="text-sm font-bold text-white mb-3 group-hover:text-gray-100 transition-colors duration-300">
                    {category.name}
                  </h3>
                  <button
                    className="text-white font-semibold hover:text-gray-200 transition-all duration-300 flex items-center space-x-1 group-hover:translate-x-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/kategori/${category.slug}`);
                    }}
                  >
                    <span className="text-sm">Ürünleri Görüntüle</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-white/10 group-hover:border-t-white/20 transition-all duration-300"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;