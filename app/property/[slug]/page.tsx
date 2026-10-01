import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { PropertyDetails } from './property-details';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabaseServer
    .from('properties')
    .select('title, description, city, property_code, property_images(image_url, is_main)')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!data) {
    return { title: 'عقار غير موجود | ARA_world' };
  }

  const mainImage = (data.property_images as any[])?.find((img) => img.is_main) ?? (data.property_images as any[])?.[0];
  const title = `${data.title} | ARA_world`;
  const description = data.description ?? `${data.title} - ${data.city ?? ''} | ${data.property_code}`;

  return {
    title,
    description,
    keywords: [
      `${data.title} للبيع`,
      `عقار في ${data.city ?? ''}`,
      'عقارات للبيع في مصر',
      'بيع عقارات',
      data.city ?? '',
      'ARA world',
    ].filter(Boolean),
    alternates: { canonical: `/property/${params.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ar_EG',
      images: mainImage ? [{ url: mainImage.image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage.image_url] : [],
    },
  };
}

export default function PropertyPage({ params }: { params: { slug: string } }) {
  return <PropertyDetails slug={params.slug} />;
}
