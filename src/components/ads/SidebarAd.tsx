import React from 'react';
import GoogleAdsense from '../GoogleAdsense';

interface SidebarAdProps {
  slot: string;
  className?: string;
}

const SidebarAd: React.FC<SidebarAdProps> = ({ slot, className = '' }) => {
  return (
    <div className={`mb-6 overflow-hidden rounded-lg border ${className}`}>
      <div className="p-1 text-xs text-muted-foreground">Advertisement</div>
      <GoogleAdsense
        slot={slot}
        format="vertical"
        style={{ display: 'block', minHeight: '600px' }}
        responsive={true}
      />
    </div>
  );
};

export default SidebarAd;
