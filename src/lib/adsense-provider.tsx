import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdsenseContextType {
  isInitialized: boolean;
}

const AdsenseContext = createContext<AdsenseContextType>({
  isInitialized: false,
});

export const useAdsense = () => useContext(AdsenseContext);

interface AdsenseProviderProps {
  children: React.ReactNode;
}

export const AdsenseProvider: React.FC<AdsenseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if AdSense script is loaded
    const checkAdsenseLoaded = () => {
      if (window.adsbygoogle) {
        setIsInitialized(true);
        console.log('Google AdSense initialized successfully');
      } else {
        console.warn('Google AdSense not initialized yet');
      }
    };

    // Check if AdSense is already loaded
    if (window.adsbygoogle) {
      setIsInitialized(true);
    } else {
      // Set up a listener for when the script loads
      const handleScriptLoad = () => {
        checkAdsenseLoaded();
      };

      // Find the AdSense script element
      const adsenseScript = document.querySelector('script[src*="adsbygoogle.js"]');
      
      if (adsenseScript) {
        if (adsenseScript.getAttribute('data-loaded') === 'true') {
          checkAdsenseLoaded();
        } else {
          adsenseScript.addEventListener('load', handleScriptLoad);
        }
      } else {
        console.warn('Google AdSense script not found in the document');
      }

      return () => {
        if (adsenseScript) {
          adsenseScript.removeEventListener('load', handleScriptLoad);
        }
      };
    }
  }, []);

  return (
    <AdsenseContext.Provider value={{ isInitialized }}>
      {children}
    </AdsenseContext.Provider>
  );
};

export default AdsenseProvider;
