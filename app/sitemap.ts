import type { MetadataRoute } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ara-world.com';
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), priority: 1, changeFrequency: 'daily' },
    { url: `${baseUrl}/buy`, lastModified: new Date(), priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/sell`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly' },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/register`, lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/terms`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
  ];

  try {
    const { data } = await supabaseServer
      .from('properties')
      .select('slug, updated_at')
      .eq('approval_status', 'approved')
      .in('status', ['available', 'reserved', 'sold'])
      .not('published_at', 'is', null);

    const propertyPages: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${baseUrl}/property/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    }));

    return [...staticPages, ...propertyPages];
  } catch {
    return staticPages;
  }
}
