'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EmptyState } from '@/components/states';
import { cn } from '@/lib/utils';

const typeColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-red-500/10 text-red-500',
  property: 'bg-primary/10 text-primary',
  system: 'bg-muted text-muted-foreground',
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Notifications fetch error:', error);
      setNotifications([]);
      setLoading(false);
      return;
    }
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchNotifications();
  }, [user, authLoading]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لعرض الإشعارات</h1>
            <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-8 reveal">
            <div>
              <h1 className="text-3xl font-bold mb-2">الإشعارات</h1>
              <p className="text-muted-foreground">{unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}</p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllRead} variant="outline" size="sm">
                <CheckCheck className="h-4 w-4 ml-2" />
                تعليم الكل كمقروء
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="لا توجد إشعارات"
              description="ستظهر هنا إشعاراتك عند وجود تحديثات"
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  className={cn(
                    "reveal flex items-start gap-4 rounded-2xl border p-4 transition-all",
                    n.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                  )}
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", typeColors[n.type] ?? typeColors.info)}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">{new Date(n.created_at).toLocaleString('ar-EG')}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="text-xs text-primary hover:underline">تعليم كمقروء</button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
