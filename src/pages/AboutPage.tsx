import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Users,
  Globe,
  Factory,
  Target,
  Heart,
  Lightbulb,
  TrendingUp,
  Shield,
  Leaf,
  Clock,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

interface AboutContent {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content_data: any;
  display_order: number;
  translatedTitle?: string;
  translatedSubtitle?: string;
  translatedDescription?: string;
}

const AboutPage = () => {
  const { currentLanguage, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<AboutContent | null>(null);
  const [milestones, setMilestones] = useState<AboutContent[]>([]);
  const [values, setValues] = useState<AboutContent[]>([]);
  const [achievements, setAchievements] = useState<AboutContent[]>([]);
  const [certifications, setCertifications] = useState<AboutContent[]>([]);
  const [teams, setTeams] = useState<AboutContent[]>([]);
  const [videoData, setVideoData] = useState<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadAboutData();
    loadVideoData();
  }, [currentLanguage]);

  const loadAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('language_code', 'tr')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const translateItems = async (items: AboutContent[]) => {
          return Promise.all(
            items.map(async (item) => ({
              ...item,
              translatedTitle: await translate(
                item.title || '',
                currentLanguage,
                `about.${item.section_type}.${item.id}.title`,
                { type: 'about_content' }
              ),
              translatedSubtitle: await translate(
                item.subtitle || '',
                currentLanguage,
                `about.${item.section_type}.${item.id}.subtitle`,
                { type: 'about_content' }
              ),
              translatedDescription: await translate(
                item.description || '',
                currentLanguage,
                `about.${item.section_type}.${item.id}.description`,
                { type: 'about_content' }
              ),
            }))
          );
        };

        const storyItem = data.find(item => item.section_type === 'story');
        if (storyItem) {
          const [translatedStory] = await translateItems([storyItem]);
          setStory(translatedStory);
        }

        setMilestones(await translateItems(data.filter(item => item.section_type === 'milestone')));
        setValues(await translateItems(data.filter(item => item.section_type === 'value')));
        setAchievements(await translateItems(data.filter(item => item.section_type === 'achievement')));
        setCertifications(await translateItems(data.filter(item => item.section_type === 'certification')));
        setTeams(await translateItems(data.filter(item => item.section_type === 'team')));
      }
    } catch (error) {
      console.error('Error loading about data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideoData = async () => {
    try {
      const { data } = await supabase
        .from('homepage_video_section')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (data) setVideoData(data);
    } catch (error) {
      console.error('Error loading video:', error);
    }
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      'target': Target,
      'heart': Heart,
      'shield': Shield,
      'award': Award,
      'users': Users,
      'globe': Globe,
      'factory': Factory
    };
    return icons[iconName] || Target;
  };

  const getColorClass = (color: string) => {
    const colors: any = {
      'blue': 'bg-blue-500/20 text-blue-400',
      'red': 'bg-red-500/20 text-red-400',
      'green': 'bg-green-500/20 text-green-400',
      'yellow': 'bg-yellow-500/20 text-yellow-400',
      'purple': 'bg-purple-500/20 text-purple-400'
    };
    return colors[color] || 'bg-blue-500/20 text-blue-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {t('about.title', 'Hakkımızda')}
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              {t('about.subtitle', "1972'den bu yana aydınlatma sektöründe öncü, kaliteli ürünler ve yenilikçi çözümlerle büyüyen bir marka")}
            </p>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
                <span className="text-sm font-medium">{t('about.experience', '53 Yıllık Güven ve Deneyim')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => {
              const IconComponent = getIconComponent(achievement.content_data?.icon || 'award');
              return (
                <div
                  key={achievement.id}
                  className="text-center group bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-white/30 hover:bg-gray-800/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{achievement.translatedTitle || achievement.title}</div>
                  <div className="text-sm text-gray-300">{achievement.translatedSubtitle || achievement.subtitle}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Company Story */}
      <div className="py-20 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                {story?.translatedTitle || story?.title || t('ui.about.our_story', 'Hikayemiz')}
              </h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                {story?.content_data?.paragraphs?.map((paragraph: string, index: number) => (
                  <p key={index}>
                    {index === 0 ? (
                      <>
                        <strong className="text-white">{story?.translatedSubtitle || story?.subtitle || 'IŞILDAR Aydınlatma'}</strong>
                        {paragraph.replace(story?.subtitle || '', '')}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative aspect-video">
                {videoData?.video_url ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoData.video_url}
                      poster={videoData.thumbnail_url || undefined}
                      className="w-full h-full object-cover"
                      muted={isMuted}
                      loop
                      playsInline
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group">
                      <button
                        onClick={toggleVideo}
                        className="bg-white/20 backdrop-blur-xl p-4 rounded-full border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                      {isVideoPlaying && (
                        <button
                          onClick={toggleMute}
                          className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-xl p-2 rounded-full border border-white/20 hover:bg-black/70 transition-all duration-300"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Factory className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">{t('about.facility_title', 'Modern Üretim Tesisi')}</h3>
                <p className="text-sm text-gray-300">{t('about.facility_desc', '16.000 m² kapalı alanda son teknoloji ile üretim')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t('about.history', 'Tarihçemiz')}</h2>
            <p className="text-gray-300">{t('about.history_desc', '53 yıllık yolculuğumuzun önemli dönüm noktaları')}</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-white/20 via-white/40 to-white/20"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-gray-800/50 transition-all duration-300 group">
                      <div className="text-2xl font-bold text-white mb-2">{milestone.translatedTitle || milestone.title}</div>
                      <div className="text-lg font-semibold text-gray-200 mb-2">{milestone.translatedSubtitle || milestone.subtitle}</div>
                      <div className="text-sm text-gray-400">{milestone.translatedDescription || milestone.content_data?.description}</div>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full border-4 border-black z-10">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                  </div>

                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <div className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t('about.values', 'Değerlerimiz')}</h2>
            <p className="text-gray-300">{t('about.values_desc', 'Bizi yönlendiren ilkeler ve hedefler')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const IconComponent = getIconComponent(value.content_data?.icon || 'target');
              const colorClass = getColorClass(value.content_data?.color || 'blue');
              return (
                <div
                  key={value.id}
                  className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 hover:bg-gray-800/50 transition-all duration-300 group text-center hover:scale-105"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{value.translatedTitle || value.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{value.translatedDescription || value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t('about.certifications', 'Sertifikalarımız')}</h2>
            <p className="text-gray-300">{t('about.certifications_desc', 'Kalite ve güvenilirliğimizin kanıtı')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={cert.id}
                className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-gray-800/50 transition-all duration-300 group flex items-center space-x-4"
              >
                <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{cert.translatedTitle || cert.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t('about.team', 'Ekibimiz')}</h2>
            <p className="text-gray-300">{t('about.team_desc', 'Deneyimli ve uzman kadromuzla hizmetinizdeyiz')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="text-center bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 hover:bg-gray-800/50 transition-all duration-300 group hover:scale-105"
              >
                <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {team.translatedTitle || team.title}
                </div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">{team.translatedSubtitle || team.subtitle}</h3>
                <p className="text-sm text-gray-400">{team.translatedDescription || team.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;