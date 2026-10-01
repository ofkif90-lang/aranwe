'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Building2, FileText, Inbox, Bell, ShoppingBag, Home, TrendingUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface DashboardStats {
  favorites: number;
  properties: number;
  pendingRequests: number;
  openTickets: number;
  unreadNotifications: number;
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [favRes, propRes, pendingRes, ticketRes, notifRes] = await Promise.all([
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('sell_requests').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['open', 'in_progress', 'waiting_user']),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false).eq('is_admin', false),
      ]);

      setStats({
        favorites: favRes.count ?? 0,
        properties: propRes.count ?? 0,
        pendingRequests: pendingRes.count ?? 0,
        openTickets: ticketRes.count ?? 0,
        unreadNotifications: notifRes.count ?? 0,
      });
      setStatsLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
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
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h1>
            <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const quickActions = [
    { href: '/buy', label: 'شراء عقار', icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
    { href: '/sell', label: 'بيع عقار', icon: Home, color: 'bg-gold/10 text-gold' },
    { href: '/favorites', label: 'المفضلة', icon: Heart, color: 'bg-red-500/10 text-red-500' },
    { href: '/my-properties', label: 'عقاراتي', icon: Building2, color: 'bg-blue-500/10 text-blue-500' },
    { href: '/my-requests', label: 'طلباتي', icon: FileText, color: 'bg-cyan-500/10 text-cyan-600' },
    { href: '/contact', label: 'الدعم الفني', icon: Inbox, color: 'bg-amber-500/10 text-amber-600' },
    { href: '/notifications', label: 'الإشعارات', icon: Bell, color: 'bg-orange-500/10 text-orange-500' },
  ];

  const statCards = [
    { label: 'العقارات المفضلة', value: stats?.favorites, icon: Heart, color: 'text-red-500' },
    { label: 'عقاراتي', value: stats?.properties, icon: Building2, color: 'text-blue-500' },
    { label: 'طلبات قيد المراجعة', value: stats?.pendingRequests, icon: Clock, color: 'text-amber-500' },
    { label: 'تذاكر دعم مفتوحة', value: stats?.openTickets, icon: Inbox, color: 'text-cyan-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">
              مرحباً، {profile?.full_name?.split(' ')[0] ?? 'مستخدم'}!
            </h1>
            <p className="text-muted-foreground">إليك نظرة سريعة على حسابك ونشاطك</p>
          </div>

          {/* Account info */}
          <Card className="mb-6 reveal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                  {profile?.full_name?.charAt(0) ?? 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                  <p className="text-sm text-muted-foreground">@{profile?.username} · {profile?.email}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="mr-auto">
                  <Link href="/profile">تعديل الملف</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <Card key={i} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    {statsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-2xl font-bold">{stat.value ?? 0}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-bold mb-4 reveal">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {quickActions.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-border bg-card p-5 text-center hover:border-primary/50 hover:shadow-md transition-all reveal"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </Link>
            ))}
          </div>

          {/* Unread notifications badge */}
          {stats && stats.unreadNotifications > 0 && (
            <Card className="reveal bg-primary/5 border-primary/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">لديك {stats.unreadNotifications} إشعار غير مقروء</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/notifications">عرض الإشعارات</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
