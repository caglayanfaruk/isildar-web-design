import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LogoProps {
  isScrolled: boolean;
}

interface BrandingSettings {
  logo_light: string;
  logo_dark: string;
  logo_width: string;
  logo_height: string;
}

const Logo: React.FC<LogoProps> = ({ isScrolled }) => {
  const [branding, setBranding] = useState<BrandingSettings>({
    logo_light: '',
    logo_dark: '',
    logo_width: '200',
    logo_height: '60'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'branding')
        .eq('is_public', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const brandingData: any = {};
        data.forEach((setting) => {
          const value = typeof setting.value === 'string' ? setting.value : JSON.parse(JSON.stringify(setting.value));
          brandingData[setting.key] = value.replace(/"/g, '');
        });
        setBranding(prev => ({ ...prev, ...brandingData }));
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-[200px] h-[60px] bg-white/10 animate-pulse rounded"></div>
      </div>
    );
  }

  const logoUrl = branding.logo_dark || 'https://isildar-white-logo.tiiny.site/isildar-white-logo.svg';
  const width = branding.logo_width || '200';
  const height = branding.logo_height || '60';

  return (
    <a href="/" className="flex items-center space-x-3 group cursor-pointer">
      <div className="flex flex-col">
        <img
          src={logoUrl}
          alt="Logo"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            objectFit: 'contain',
            filter: isScrolled
              ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              : 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
          }}
          className="transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
        />
      </div>
    </a>
  );
};

export default Logo;
