import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

interface VideoSectionData {
  id: string;
  video_url: string;
  thumbnail_image_id: string | null;
  duration: string;
  quality: string;
  subtitle_info: string;
  media?: {
    url: string;
  };
}

interface VideoFeature {
  id: string;
  icon: string;
  sort_order: number;
  title_tr?: string;
  description_tr?: string;
}

const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoData, setVideoData] = useState<VideoSectionData | null>(null);
  const [features, setFeatures] = useState<VideoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    loadVideoSection();
    loadFeatures();
  }, []);

  const loadVideoSection = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_video_section')
        .select(`
          *,
          media:thumbnail_image_id (
            url
          )
        `)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setVideoData(data);
    } catch (error) {
      console.error('Error loading video section:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_video_features')
        .select('id, icon, sort_order, title_tr, description_tr')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading video features:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Star;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (loading) {
    return null;
  }

  if (!videoData || !videoData.is_active) {
    return null;
  }

  const thumbnailUrl = videoData.media?.url || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';

  return (
    <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white mb-8 hover:bg-white/15 transition-all duration-300 group cursor-pointer">
            <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            <span className="font-medium">{t('homepage.video.badge', 'Üretime Göz Atın')}</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              {t('homepage.video.title', 'Üretim Sürecimizi Keşfedin')}
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('homepage.video.description', 'Modern tesislerimizde gerçekleştirdiğimiz üretim sürecini ve kalite standartlarımızı yakından görün')}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div
            className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 group cursor-pointer"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {videoData.video_url && videoData.video_url.trim() !== '' ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoData.video_url}
                    poster={thumbnailUrl}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    onError={(e) => {
                      console.error('Video loading error:', e);
                      console.log('Video URL:', videoData.video_url);
                    }}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500"></div>
                  )}
                </>
              ) : (
                <>
                  <img
                    src={thumbnailUrl}
                    alt={t('homepage.video.video_title', 'Üretim Videosu')}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500"></div>
                  {!videoData.video_url && (
                    <div className="absolute top-4 left-4 bg-yellow-500/90 text-black text-xs px-3 py-1 rounded-full">
                      Video henüz yüklenmedi
                    </div>
                  )}
                </>
              )}

              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="group/play bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white p-8 rounded-full transition-all duration-500 hover:scale-110 border border-white/30 hover:border-white/50"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    {isPlaying ? (
                      <Pause className="w-12 h-12 relative z-10" />
                    ) : (
                      <Play className="w-12 h-12 ml-1 relative z-10" />
                    )}
                  </div>
                </button>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{t('homepage.video.video_title', 'Üretim Videosu')}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{videoData.duration}</span>
                        </div>
                        <span>•</span>
                        <span>{videoData.subtitle_info}</span>
                        <span>•</span>
                        <span>{videoData.quality}</span>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-3 transition-all duration-300 ${
                      showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}>
                      <button
                        onClick={handleMuteToggle}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: isPlaying ? '100%' : '0%' }}
              />
            </div>
          </div>

          {features.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {features.map((feature) => {
                const IconComponent = getIconComponent(feature.icon);
                return (
                  <div
                    key={feature.id}
                    className="text-center bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 hover:bg-gray-800/50 transition-all duration-300 group hover:scale-105"
                  >
                    <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {t(`homepage.video.feature.${feature.id}.title`, feature.title_tr || 'Özellik')}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {t(`homepage.video.feature.${feature.id}.description`, feature.description_tr || 'Özellik açıklaması')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
