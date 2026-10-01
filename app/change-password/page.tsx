'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ChangePasswordContent />
    </Suspense>
  );
}

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const forceChange = searchParams.get('force') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.new !== form.confirm) {
      setError('كلمات المرور الجديدة غير متطابقة');
      return;
    }
    if (form.new.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: form.current,
        });

        if (signInError) {
          setError('كلمة المرور الحالية غير صحيحة');
          setLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: form.new });

      if (updateError) throw updateError;

      if (profile?.must_change_password) {
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', user?.id);
        await refreshProfile();
      }

      toast({ title: 'تم تغيير كلمة المرور بنجاح' });
      router.push(profile?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12 flex items-center justify-center px-4">
        <div className="w-full max-w-md reveal-scale">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">تغيير كلمة المرور</h1>
            <p className="text-muted-foreground mt-2">أدخل كلمة مرورك الحالية والجديدة</p>
          </div>

          {forceChange && (
            <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700">تغيير إجباري لكلمة المرور</AlertTitle>
              <AlertDescription className="text-amber-600">
                يجب تغيير كلمة المرور الافتراضية قبل المتابعة
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="current">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input id="current" type={showCurrent ? 'text' : 'password'} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className="pl-10" required />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input id="new" type={showNew ? 'text' : 'password'} value={form.new} onChange={(e) => setForm({ ...form, new: e.target.value })} className="pl-10" required />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">تأكيد كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="pl-10" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تغيير كلمة المرور'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
