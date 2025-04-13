import React from 'react';
import GoogleAdsense from '../GoogleAdsense';

interface InFeedAdProps {
  slot: string;
  className?: string;
}

const InFeedAd: React.FC<InFeedAdProps> = ({ slot, className = '' }) => {
  return (
    <div className={`my-4 overflow-hidden rounded-lg border ${className}`}>
      <div className="p-1 text-xs text-muted-foreground">Advertisement</div>
      <GoogleAdsense
        slot={slot}
        format="rectangle"
        style={{ display: 'block', minHeight: '250px' }}
        responsive={true}
      />
    </div>
  );
};

export default InFeedAd;
