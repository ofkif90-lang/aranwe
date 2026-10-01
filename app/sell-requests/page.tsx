'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Eye, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellRequest, SellRequestStatus } from '@/lib/types';
import { ApprovalBadge } from '@/components/status-badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EmptyState } from '@/components/states';

const statusConfig: Record<SellRequestStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'قيد المراجعة', icon: Clock, color: 'text-amber-500' },
  approved: { label: 'مقبول', icon: CheckCircle2, color: 'text-emerald-500' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'text-red-500' },
  published: { label: 'منشور', icon: CheckCircle2, color: 'text-primary' },
  reserved: { label: 'محجوز', icon: Clock, color: 'text-amber-500' },
  sold: { label: 'تم البيع', icon: CheckCircle2, color: 'text-blue-500' },
};

export default function SellRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<SellRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data, error } = await supabase
        .from('sell_requests')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data as SellRequest[]);
      }
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
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لعرض طلبات البيع</h1>
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
            <h1 className="text-3xl font-bold mb-2">طلبات البيع</h1>
            <p className="text-muted-foreground">تابع حالة طلبات بيع عقاراتك</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد طلبات بيع"
              description="لم تقم بعرض أي عقار للبيع بعد"
              action={<Button asChild><Link href="/sell">عرض عقار للبيع</Link></Button>}
            />
          ) : (
            <div className="space-y-4">
              {requests.map((req, i) => {
                const config = statusConfig[req.status];
                const StatusIcon = config.icon;
                return (
                  <Card key={req.id} className="reveal" >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-primary">{req.property?.property_code}</span>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${config.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {config.label}
                            </span>
                          </div>
                          <h3 className="font-bold mb-1">{req.property?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {req.property?.city} · {new Date(req.created_at).toLocaleDateString('ar-EG')}
                          </p>
                          {req.rejection_reason && (
                            <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                              <p className="text-sm text-destructive font-medium">سبب الرفض:</p>
                              <p className="text-sm text-destructive/80 mt-1">{req.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {req.property && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/property/${req.property.slug}`}>
                                <Eye className="h-4 w-4 ml-1" />
                                عرض
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
