import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  site_name?: string;
  site_description?: string;
  site_keywords?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_verification?: string;
  meta_verification?: string;
}

function parseSettingValue(raw: any): any {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'ISILDAR Aydinlatma',
    site_description: 'Premium lighting solutions',
    site_keywords: 'lighting, LED, industrial'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'site_name', 'site_description', 'site_keywords',
            'maintenance_mode', 'maintenance_message',
            'google_analytics_id', 'facebook_pixel_id',
            'google_verification', 'meta_verification'
          ])
          .eq('is_public', true);

        if (error) {
          console.error('[useSiteSettings] Error loading settings:', error);
          return;
        }

        if (data) {
          const settingsObj: SiteSettings = {};
          data.forEach(setting => {
            (settingsObj as any)[setting.key] = parseSettingValue(setting.value);
          });
          setSettings(prev => ({ ...prev, ...settingsObj }));
        }
      } catch (error) {
        console.error('[useSiteSettings] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.site_name) {
      document.title = settings.site_name;
    }

    updateOrCreateMeta('description', settings.site_description);
    updateOrCreateMeta('keywords', settings.site_keywords);

    if (settings.google_verification) {
      updateOrCreateMeta('google-site-verification', settings.google_verification);
    }
    if (settings.meta_verification) {
      updateOrCreateMeta('facebook-domain-verification', settings.meta_verification);
    }

    injectGoogleAnalytics(settings.google_analytics_id);
    injectFacebookPixel(settings.facebook_pixel_id);
  }, [settings]);

  return { settings, loading };
}

function updateOrCreateMeta(name: string, content?: string) {
  if (!content) return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

function injectGoogleAnalytics(gaId?: string) {
  if (!gaId || document.getElementById('ga-script')) return;

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const inlineScript = document.createElement('script');
  inlineScript.id = 'ga-inline';
  inlineScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(inlineScript);
}

function injectFacebookPixel(pixelId?: string) {
  if (!pixelId || document.getElementById('fb-pixel')) return;

  const script = document.createElement('script');
  script.id = 'fb-pixel';
  script.textContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.id = 'fb-pixel-noscript';
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}
