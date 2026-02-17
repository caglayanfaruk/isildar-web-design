import React, { useEffect, useState, useRef } from 'react';
import { Target, Star, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

interface Stat {
  id: string;
  icon: string;
  number_value: string;
  sort_order: number;
}

interface Feature {
  id: string;
  sort_order: number;
}

interface VideoSectionData {
  id: string;
  video_url: string;
  thumbnail_image_id: string | null;
  duration: string;
  quality: string;
  subtitle_info: string;
  is_active: boolean;
  media?: {
    url: string;
  };
}

const AboutSection = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState<VideoSectionData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadStats();
    loadFeatures();
    loadVideoSection();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_stats')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_about_features')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

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
    }
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

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || Star;
  };

  if (loading) return null;

  const thumbnailUrl = videoData?.media?.url || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';

  return (
    <section id="about" className="py-20 lg:py-28 bg-gradient-to-b from-gray-950 via-black to-gray-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/[0.06] rounded-full border border-white/10 text-white/70 text-sm mb-6">
                <Target className="w-4 h-4 mr-2" />
                <span>{t('homepage.about.badge')}</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                {t('homepage.about.title')}
              </h2>
              <p className="text-base lg:text-lg text-white/50 font-light">
                {t('homepage.about.subtitle')}
              </p>
            </div>

            <div className="space-y-4 text-white/60 text-[15px] leading-relaxed">
              <p>{t('homepage.about.paragraph_1')}</p>
              <p>{t('homepage.about.paragraph_2')}</p>
              <p>{t('homepage.about.paragraph_3')}</p>
              <p>{t('homepage.about.paragraph_4')}</p>
            </div>

            {features.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center space-x-3 px-4 py-3 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-colors duration-300"
                  >
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-white/60">
                      {t(`homepage.about.feature.${feature.id}.label`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {videoData && (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <div className="relative aspect-video bg-gray-900">
                  {videoData.video_url ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoData.video_url}
                        poster={thumbnailUrl}
                        className="w-full h-full object-cover"
                        muted={isMuted}
                        loop
                        playsInline
                      />
                      {!isPlaying && (
                        <div className="absolute inset-0 bg-black/30"></div>
                      )}
                    </>
                  ) : (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt={t('homepage.video.video_title', 'Uretim Videosu')}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30"></div>
                    </>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handlePlayPause}
                      className="bg-white/15 backdrop-blur-md text-white p-5 rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/25 border border-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-white/70">
                        <span>{videoData.duration}</span>
                        <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                        <span>{videoData.quality}</span>
                      </div>
                      <button
                        onClick={handleMuteToggle}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors duration-200"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/70" /> : <Volume2 className="w-3.5 h-3.5 text-white/70" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                  <div
                    className="h-full bg-white/60 transition-all duration-[60000ms] ease-linear"
                    style={{ width: isPlaying ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )}

            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => {
                  const IconComponent = getIconComponent(stat.icon);
                  return (
                    <div
                      key={stat.id}
                      className="group bg-white/[0.03] p-5 rounded-xl border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-500 text-center"
                    >
                      <div className="bg-white/[0.06] w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/10 transition-colors duration-300">
                        <IconComponent className="w-5 h-5 text-white/70" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-0.5">
                        {stat.number_value}
                      </div>
                      <div className="text-xs font-medium text-white/50 mb-0.5">
                        {t(`homepage.stats.${stat.id}.label`)}
                      </div>
                      <div className="text-[11px] text-white/30">
                        {t(`homepage.stats.${stat.id}.description`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
