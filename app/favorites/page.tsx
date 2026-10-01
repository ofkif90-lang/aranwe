'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/types';
import { PropertyCard } from '@/components/property-card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EmptyState, LoadingSkeleton } from '@/components/states';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          property:properties(
            *,
            property_images(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const props = data.map((d: any) => ({ ...d.property, is_favorited: true })) as Property[];
        setProperties(props);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لعرض المفضلة</h1>
            <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">المفضلة</h1>
            <p className="text-muted-foreground">{properties.length > 0 ? `${properties.length} عقار محفوظ` : 'لا توجد عقارات في المفضلة'}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <LoadingSkeleton className="aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-3">
                    <LoadingSkeleton className="h-5 w-3/4" />
                    <LoadingSkeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="لا توجد عقارات في المفضلة"
              description="تصفح العقارات واضغط على القلب لإضافتها هنا"
              action={<Button asChild><Link href="/buy">تصفح العقارات</Link></Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((prop, i) => (
                <PropertyCard key={prop.id} property={prop} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
