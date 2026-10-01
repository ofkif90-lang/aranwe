import { supabaseServer } from '@/lib/supabase/server';
import { Property, Profile } from '@/lib/types';

export async function getLatestProperties(limit: number = 2): Promise<Property[]> {
  const { data, error } = await supabaseServer
    .from('properties')
    .select(`
      *,
      property_images(*)
    `)
    .eq('approval_status', 'approved')
    .in('status', ['available', 'reserved', 'sold'])
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Property[];
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const { data, error } = await supabaseServer
    .from('properties')
    .select(`
      *,
      property_images(*),
      owner:profiles!properties_owner_id_fkey(*)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Property;
}

export async function getPropertyByCode(code: string): Promise<Property | null> {
  const { data, error } = await supabaseServer
    .from('properties')
    .select(`
      *,
      property_images(*)
    `)
    .eq('property_code', code)
    .maybeSingle();

  if (error || !data) return null;
  return data as Property;
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const { data } = await supabaseServer
    .from('site_settings')
    .select('setting_key, setting_value');

  if (!data) return {};
  const settings: Record<string, string> = {};
  data.forEach((s) => {
    if (s.setting_value) settings[s.setting_key] = s.setting_value;
  });
  return settings;
}
