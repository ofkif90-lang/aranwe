'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, KeyRound, Bell, Shield, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifPrefs, setNotifPrefs] = useState({ propertyUpdates: true, newMessages: true, marketing: false });

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteRequest = async () => {
    if (!user) return;
    toast({
      title: 'طلب حذف الحساب',
      description: 'تم إرسال طلبك. سيتواصل معك فريق الإدارة لإتمام الحذف.',
    });
  };

  if (!user) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
          </div>

          <div className="space-y-6">
            {/* Account */}
            <Card className="reveal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" />الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">تعديل المعلومات الشخصية</p>
                    <p className="text-xs text-muted-foreground">الاسم، اسم المستخدم، الهاتف</p>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link href="/profile">تعديل</Link></Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">تغيير كلمة المرور</p>
                    <p className="text-xs text-muted-foreground">حدّث كلمة مرورك بانتظام</p>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link href="/change-password">تغيير</Link></Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="reveal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" />الإشعارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prop-updates" className="cursor-pointer">تحديثات العقارات</Label>
                  <Switch id="prop-updates" checked={notifPrefs.propertyUpdates} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, propertyUpdates: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="msg-updates" className="cursor-pointer">الرسائل الجديدة</Label>
                  <Switch id="msg-updates" checked={notifPrefs.newMessages} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, newMessages: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing" className="cursor-pointer">عروض وتسويق</Label>
                  <Switch id="marketing" checked={notifPrefs.marketing} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, marketing: v })} />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="reveal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-primary" />الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">كلمة المرور</p>
                    <p className="text-xs text-muted-foreground">آخر تغيير: غير معروف</p>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link href="/change-password">تغيير</Link></Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">الجلسة الحالية</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-3 py-1 text-xs font-semibold">نشط</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card className="reveal border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive"><Settings className="h-5 w-5" />إدارة الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">تسجيل الخروج</p>
                    <p className="text-xs text-muted-foreground">إنهاء جلستك الحالية</p>
                  </div>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 ml-1" />خروج
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">حذف الحساب</p>
                    <p className="text-xs text-muted-foreground">طلب حذف حسابك نهائياً</p>
                  </div>
                  <Button onClick={handleDeleteRequest} variant="destructive" size="sm">طلب حذف</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
