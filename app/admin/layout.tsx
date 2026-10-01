'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, FileText, Users, MessageSquare,
  Bell, Settings, LogOut, Menu, X, ChevronLeft, Shield, Activity, Inbox, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notification-bell';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'العقارات', icon: Building2 },
  { href: '/admin/deals', label: 'الصفقات والعمولات', icon: TrendingUp },
  { href: '/admin/sell-requests', label: 'طلبات البيع', icon: FileText },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/messages', label: 'الرسائل', icon: MessageSquare },
  { href: '/admin/support', label: 'تذاكر الدعم', icon: Inbox },
  { href: '/admin/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/admin/activity', label: 'سجل النشاط', icon: Activity },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      (async () => {
        const { count } = await supabase
          .from('sell_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingCount(count ?? 0);
      })();
    }
  }, [profile, pathname]);

  if (loading || !user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
          A
        </div>
        <div>
          <span className="text-lg font-bold">ARA<span className="text-primary">_world</span></span>
          <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.href === '/admin/sell-requests' && pendingCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {profile?.full_name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
          </div>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
          <LogOut className="h-4 w-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed right-0 top-0 z-30 hidden h-screen w-64 border-l border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pr-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-lg font-bold">
              {navItems.find((n) => isActive(n.href))?.label ?? 'لوحة التحكم'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {profile?.full_name?.charAt(0) ?? 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground leading-tight">@{profile?.username}</p>
              </div>
            </div>
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              <span className="hidden sm:inline">العودة للموقع</span>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
