import { Helmet } from 'react-helmet-async';

interface WebsiteStructuredDataProps {
  url: string;
  name: string;
  description: string;
}

export function WebsiteStructuredData({ url, name, description }: WebsiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

interface OrganizationStructuredDataProps {
  url: string;
  name: string;
  logo: string;
  description?: string;
}

export function OrganizationStructuredData({ 
  url, 
  name, 
  logo, 
  description 
}: OrganizationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url,
    name,
    logo,
    description
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

interface PrayerRequestStructuredDataProps {
  url: string;
  headline: string;
  description: string;
  author: string;
  datePublished: string;
}

export function PrayerRequestStructuredData({
  url,
  headline,
  description,
  author,
  datePublished
}: PrayerRequestStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Person',
      name: author
    },
    datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'CryOutNow',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cryoutnow.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
