'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Mail, Loader2, Eye, Clock, CheckCircle2, XCircle, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellRequest, SellRequestStatus, Inquiry, PropertyLead, LEAD_STATUS_LABELS, LeadStatus } from '@/lib/types';
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

export default function MyRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sellRequests, setSellRequests] = useState<(SellRequest & { property?: { title: string; property_code: string; slug: string; city: string } })[]>([]);
  const [inquiries, setInquiries] = useState<(Inquiry & { property?: { title: string; slug: string; property_code: string } })[]>([]);
  const [leads, setLeads] = useState<(PropertyLead & { property?: { title: string; slug: string; property_code: string; city: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      const [sellRes, inqRes, leadsRes] = await Promise.all([
        supabase
          .from('sell_requests')
          .select('*, property:properties(title, property_code, slug, city)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('inquiries')
          .select('*, property:properties(title, slug, property_code)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('property_leads')
          .select('*, property:properties(title, slug, property_code, city)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!sellRes.error && sellRes.data) setSellRequests(sellRes.data as any);
      if (!inqRes.error && inqRes.data) setInquiries(inqRes.data as any);
      if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as any);
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
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لعرض طلباتك</h1>
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">طلباتي</h1>
            <p className="text-muted-foreground">تابع جميع طلباتك في مكان واحد</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Tabs defaultValue="sell" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="sell">
                  <FileText className="h-4 w-4 ml-2" />
                  طلبات البيع ({sellRequests.length})
                </TabsTrigger>
                <TabsTrigger value="viewing">
                  <Calendar className="h-4 w-4 ml-2" />
                  طلبات المعاينة ({leads.length})
                </TabsTrigger>
                <TabsTrigger value="buy">
                  <Mail className="h-4 w-4 ml-2" />
                  استفسارات الشراء ({inquiries.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sell" className="space-y-4">
                {sellRequests.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="لا توجد طلبات بيع"
                    description="لم تقم بعرض أي عقار للبيع بعد"
                    action={<Button asChild><Link href="/sell">عرض عقار للبيع</Link></Button>}
                  />
                ) : (
                  sellRequests.map((req) => {
                    const config = statusConfig[req.status];
                    const StatusIcon = config.icon;
                    return (
                      <Card key={req.id} className="reveal">
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
                            {req.property && (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/property/${req.property.slug}`}>
                                  <Eye className="h-4 w-4 ml-1" />
                                  عرض
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="viewing" className="space-y-4">
                {leads.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="لا توجد طلبات معاينة"
                    description="لم تقم بطلب معاينة لأي عقار بعد"
                    action={<Button asChild><Link href="/buy">تصفح العقارات</Link></Button>}
                  />
                ) : (
                  leads.map((lead) => (
                    <Card key={lead.id} className="reveal">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {lead.property && (
                                <span className="font-bold text-sm text-primary">{lead.property.property_code}</span>
                              )}
                              <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                                {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                              </span>
                            </div>
                            <h3 className="font-bold mb-1">{lead.property?.title ?? 'عقار'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {lead.property?.city} · {new Date(lead.created_at).toLocaleDateString('ar-EG')}
                            </p>
                            {lead.preferred_date && (
                              <p className="text-sm text-muted-foreground mt-1">
                                التاريخ المفضل: {lead.preferred_date}
                              </p>
                            )}
                          </div>
                          {lead.property && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/property/${lead.property.slug}`}>
                                <Eye className="h-4 w-4 ml-1" />
                                عرض
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="buy" className="space-y-4">
                {inquiries.length === 0 ? (
                  <EmptyState
                    icon={Mail}
                    title="لا توجد استفسارات"
                    description="لم تقم بإرسال أي استفسار بعد"
                    action={<Button asChild><Link href="/buy">تصفح العقارات</Link></Button>}
                  />
                ) : (
                  inquiries.map((inq) => (
                    <Card key={inq.id} className="reveal">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {inq.property && (
                                <span className="font-bold text-sm text-primary">{inq.property.property_code}</span>
                              )}
                            </div>
                            <h3 className="font-bold mb-1">{inq.property?.title ?? 'استفسار'}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{inq.message}</p>
                            <p className="text-xs text-muted-foreground/70 mt-2">{new Date(inq.created_at).toLocaleString('ar-EG')}</p>
                          </div>
                          {inq.property && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/property/${inq.property.slug}`}>
                                <Eye className="h-4 w-4 ml-1" />
                                عرض
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
