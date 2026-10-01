'use client';

import { useState, useEffect } from 'react';
import { User, Loader2, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        username: profile.username,
        email: profile.email,
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'نوع ملف غير صحيح', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'حجم كبير', description: 'حد أقصى 2 ميجابايت', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      await refreshProfile();
      toast({ title: 'تم تحديث الصورة' });
    } catch {
      toast({ title: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        username: form.username,
        phone: form.phone,
      }).eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('اسم المستخدم مستخدم بالفعل');
        }
        throw error;
      }

      await refreshProfile();
      toast({ title: 'تم تحديث الملف الشخصي' });
    } catch (err) {
      toast({ title: 'فشل التحديث', description: err instanceof Error ? err.message : 'حدث خطأ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">الملف الشخصي</h1>
            <p className="text-muted-foreground">عدّل معلوماتك الشخصية</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 reveal-scale">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {profile?.full_name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow-lg">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div>
                <h2 className="text-lg font-bold">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={form.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 1xx xxx xxxx" />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 ml-2" />حفظ التغييرات</>}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
