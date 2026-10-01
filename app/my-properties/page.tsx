'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/types';
import { PropertyCard } from '@/components/property-card';
import { ApprovalBadge } from '@/components/status-badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EmptyState } from '@/components/states';

export default function MyPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from('properties')
        .select(`*, property_images(*)`)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setProperties((data as Property[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لعرض عقاراتك</h1>
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
          <div className="flex items-center justify-between mb-8 reveal">
            <div>
              <h1 className="text-3xl font-bold mb-2">عقاراتي</h1>
              <p className="text-muted-foreground">{properties.length > 0 ? `${properties.length} عقار` : 'لا توجد عقارات'}</p>
            </div>
            <Button asChild>
              <Link href="/sell"><Plus className="h-4 w-4 ml-2" />عرض عقار</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="لا توجد عقارات"
              description="ابدأ بعرض عقارك الأول للبيع"
              action={<Button asChild><Link href="/sell">عرض عقار للبيع</Link></Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop, i) => (
                <div key={prop.id} className="reveal-scale" style={{ transitionDelay: `${i * 50}ms` }}>
                  <PropertyCard property={prop} index={0} />
                  <div className="mt-2 flex items-center justify-between">
                    <ApprovalBadge status={prop.approval_status} />
                    {prop.approval_status === 'rejected' && prop.rejection_reason && (
                      <span className="text-xs text-destructive truncate max-w-[60%]">{prop.rejection_reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
