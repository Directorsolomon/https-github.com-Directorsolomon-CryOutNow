export const defaultSEO = {
  title: 'CryOutNow - Share Your Prayer Requests',
  description: 'Connect with a supportive community to share and receive prayers. CryOutNow helps you share your prayer requests and pray for others.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cryoutnow.com',
    site_name: 'CryOutNow',
    images: [
      {
        url: 'https://cryoutnow.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CryOutNow - A Prayer Community',
      },
    ],
  },
  twitter: {
    handle: '@cryoutnow',
    site: '@cryoutnow',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'application-name',
      content: 'CryOutNow',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'CryOutNow',
    },
    {
      name: 'theme-color',
      content: '#4f46e5',
    },
  ],
};
