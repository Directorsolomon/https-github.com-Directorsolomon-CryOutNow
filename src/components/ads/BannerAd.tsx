import React from 'react';
import GoogleAdsense from '../GoogleAdsense';

interface BannerAdProps {
  slot: string;
  className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ slot, className = '' }) => {
  return (
    <div className={`my-4 overflow-hidden rounded-lg border ${className}`}>
      <div className="p-1 text-xs text-muted-foreground">Advertisement</div>
      <GoogleAdsense
        slot={slot}
        format="horizontal"
        style={{ display: 'block', minHeight: '90px' }}
        responsive={true}
      />
    </div>
  );
};

export default BannerAd;
