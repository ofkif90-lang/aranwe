'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Trash2, ChevronLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Notification } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const typeColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-red-500/10 text-red-500',
  property: 'bg-primary/10 text-primary',
  system: 'bg-muted text-muted-foreground',
};

const typeIcons: Record<string, string> = {
  success: '✓',
  error: '!',
  warning: '⚠',
  info: 'i',
  property: '🏠',
  system: '●',
};

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const list = (data as Notification[]) ?? [];
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.is_read).length);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    setExpandedId((prev) => (prev === n.id ? null : n.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn('relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted', className)}
          aria-label="الإشعارات"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[calc(100vw-2rem)] sm:w-96 p-0" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-bold text-sm">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 ml-1" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'border-b border-border last:border-0 transition-colors cursor-pointer',
                  n.is_read ? 'bg-card' : 'bg-primary/5'
                )}
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-3 p-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', typeColors[n.type] ?? typeColors.info)}>
                    {typeIcons[n.type] ?? '●'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className={cn('text-sm text-muted-foreground mt-1', expandedId === n.id ? '' : 'line-clamp-1')}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString('ar-EG')}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              عرض كل الإشعارات
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
