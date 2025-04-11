import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

export default function SEO({
  title = 'CryOutNow - Share Your Prayer Requests',
  description = 'Connect with a supportive community to share and receive prayers. CryOutNow helps you share your prayer requests and pray for others.',
  canonical,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
}: SEOProps) {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://cryoutnow.com';
  const fullCanonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullOgImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullOgImageUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="CryOutNow" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImageUrl} />
      
      {/* Additional SEO Tags */}
      <meta name="application-name" content="CryOutNow" />
      <meta name="apple-mobile-web-app-title" content="CryOutNow" />
      <meta name="theme-color" content="#4f46e5" />
    </Helmet>
  );
}
