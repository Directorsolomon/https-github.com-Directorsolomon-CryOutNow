import React, { useEffect, useState } from 'react';

interface GoogleAdsenseProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  responsive?: boolean;
  className?: string;
}

const GoogleAdsense: React.FC<GoogleAdsenseProps> = ({
  slot,
  format = 'auto',
  style = {},
  responsive = true,
  className = '',
}) => {
  const publisherId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Push the command to Google AdSense to render ads
    try {
      // Only push if adsbygoogle is defined and this is a production environment
      if (window.adsbygoogle) {
        // Add a small delay to ensure the script is fully loaded
        const timer = setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('AdSense push command executed for slot:', slot);
          } catch (pushError) {
            console.error('Error pushing ad to AdSense:', pushError);
            setAdError(true);
          }
        }, 100);

        return () => clearTimeout(timer);
      } else {
        console.warn('AdSense not available yet');
        // Don't set error here as it might just need time to load
      }
    } catch (error) {
      console.error('Error initializing AdSense ad:', error);
      setAdError(true);
    }
  }, [slot]);

  if (!publisherId) {
    console.warn('Google AdSense publisher ID is not defined in environment variables');
    return null;
  }

  // In development, show a placeholder instead of real ads
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment || adError) {
    return (
      <div
        className={`google-adsense-placeholder ${className}`}
        style={{
          ...style,
          backgroundColor: '#f0f0f0',
          border: '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          minHeight: format === 'vertical' ? '600px' : format === 'rectangle' ? '250px' : '90px',
          width: '100%',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}
      >
        {isDevelopment ? (
          <div>
            <p>AdSense Ad Placeholder</p>
            <p>Format: {format} | Slot: {slot}</p>
            <p>Real ads will appear in production</p>
          </div>
        ) : (
          <div>
            <p>Ad content unavailable</p>
            <p>Please check your AdSense configuration</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`google-adsense ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default GoogleAdsense;
