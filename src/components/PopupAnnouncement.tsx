import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface PopupData {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
  desktop_width: number;
  desktop_height: number;
  tablet_width: number;
  tablet_height: number;
  mobile_width: number;
  mobile_height: number;
  cookie_duration_days: number;
}

const PopupAnnouncement: React.FC = () => {
  const location = useLocation();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (location.pathname === '/') {
      checkAndShowPopup();
    }
  }, [location.pathname]);

  const checkAndShowPopup = async () => {
    try {
      const { data, error } = await supabase
        .from('popup_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const cookieName = `popup_closed_${data.id}`;
      const popupClosed = getCookie(cookieName);

      if (!popupClosed) {
        setPopup(data);
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Popup yüklenirken hata:', error);
    }
  };

  const handleClose = () => {
    if (popup) {
      const cookieName = `popup_closed_${popup.id}`;
      setCookie(cookieName, 'true', popup.cookie_duration_days);
    }
    setIsVisible(false);
  };

  const handleLinkClick = () => {
    if (popup?.link_url) {
      window.open(popup.link_url, '_blank', 'noopener,noreferrer');
      handleClose();
    }
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  if (!isVisible || !popup || location.pathname !== '/') return null;

  const getResponsiveStyles = () => {
    return {
      desktop: {
        width: `${popup.desktop_width}px`,
        height: `${popup.desktop_height}px`,
      },
      tablet: {
        width: `${popup.tablet_width}px`,
        height: `${popup.tablet_height}px`,
      },
      mobile: {
        width: `${popup.mobile_width}%`,
        height: `${popup.mobile_height}px`,
      },
    };
  };

  const styles = getResponsiveStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="bg-white rounded-lg shadow-2xl relative overflow-hidden animate-fadeIn popup-container"
        style={{
          width: styles.desktop.width,
          maxWidth: '90vw',
          maxHeight: '90vh',
        }}
      >
        <style>
          {`
            @media (max-width: 1024px) {
              .popup-container {
                width: ${styles.tablet.width} !important;
              }
            }
            @media (max-width: 640px) {
              .popup-container {
                width: ${styles.mobile.width} !important;
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `}
        </style>

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all hover:scale-110"
          aria-label="Kapat"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="popup-container h-full overflow-y-auto flex flex-col">
          <div className="p-6 pb-4 space-y-3">
            {popup.title && (
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {popup.title}
              </h2>
            )}

            {popup.content && (
              <div
                className="text-gray-700 text-sm md:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: popup.content }}
              />
            )}

            {popup.link_url && (
              <button
                onClick={handleLinkClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                {popup.link_text}
              </button>
            )}
          </div>

          {popup.image_url && (
            <div className="relative w-full flex-shrink-0">
              <img
                src={popup.image_url}
                alt={popup.title}
                className="w-full h-auto object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupAnnouncement;
