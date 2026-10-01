import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/profile', '/settings', '/favorites', '/notifications', '/my-properties', '/sell-requests', '/change-password'],
    },
    sitemap: 'https://ara-world.com/sitemap.xml',
  };
}
