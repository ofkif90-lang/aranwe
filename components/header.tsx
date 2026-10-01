'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Heart, Menu, Home, ShoppingBag, Tag, Phone, User, LogOut, Settings, KeyRound, Building, FileText, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/buy', label: 'شراء', icon: ShoppingBag },
    { href: '/sell', label: 'بيع', icon: Tag },
    { href: '/favorites', label: 'المفضلة', icon: Heart },
    { href: '/contact', label: 'تواصل', icon: Phone },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled ? 'glass shadow-md' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg">
            A
          </div>
          <span className={cn('text-xl font-bold tracking-tight transition-colors', scrolled ? 'text-foreground' : 'text-white')}>
            ARA<span className="text-primary">_world</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'text-primary'
                  : scrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-primary'
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 right-1/2 h-0.5 w-6 translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell className={cn(!scrolled && 'text-white hover:bg-white/10')} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/10">
                    <Avatar className={cn('h-9 w-9 border-2', scrolled ? 'border-primary/20' : 'border-white/30')}>
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className={cn('font-semibold', scrolled ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white')}>
                        {profile?.full_name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn('hidden text-sm font-medium md:block', scrolled ? 'text-foreground' : 'text-white')}>
                      {profile?.full_name?.split(' ')[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="ml-2 h-4 w-4" />لوحة التحكم</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="ml-2 h-4 w-4" />الملف الشخصي</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-properties"><Building className="ml-2 h-4 w-4" />عقاراتي</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-requests"><FileText className="ml-2 h-4 w-4" />طلباتي</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sell-requests"><FileText className="ml-2 h-4 w-4" />طلبات البيع</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites"><Heart className="ml-2 h-4 w-4" />المفضلة</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications"><Bell className="ml-2 h-4 w-4" />الإشعارات</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings"><Settings className="ml-2 h-4 w-4" />الإعدادات</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/change-password"><KeyRound className="ml-2 h-4 w-4" />تغيير كلمة المرور</Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary font-semibold">
                          <Building className="ml-2 h-4 w-4" />لوحة التحكم
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="ml-2 h-4 w-4" />تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className={cn('hidden sm:flex', !scrolled && 'text-white hover:bg-white/10 hover:text-white')}>
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link href="/register">إنشاء حساب</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('lg:hidden', !scrolled && 'text-white hover:bg-white/10')} aria-label="القائمة">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold">ARA<span className="text-primary">_world</span></span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                        isActive(link.href) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {!user && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose asChild>
                      <Link href="/login" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">
                        <User className="h-4 w-4" />تسجيل الدخول
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/register" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg">
                        <User className="h-4 w-4" />إنشاء حساب
                      </Link>
                    </SheetClose>
                  </>
                )}
                {user && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose asChild>
                      <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">
                        <LayoutDashboard className="h-4 w-4" />لوحة التحكم
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/my-requests" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted">
                        <FileText className="h-4 w-4" />طلباتي
                      </Link>
                    </SheetClose>
                    {profile?.role === 'admin' && (
                      <SheetClose asChild>
                        <Link href="/admin" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-primary bg-primary/5">
                          <Building className="h-4 w-4" />لوحة الإدارة
                        </Link>
                      </SheetClose>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
