'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({ title: 'تم إرسال رابط إعادة التعيين', description: 'تحقق من بريدك الإلكتروني' });
    } catch (err) {
      toast({
        title: 'حدث خطأ',
        description: err instanceof Error ? err.message : 'حدث خطأ ما',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="w-full max-w-md reveal-scale">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
            <p className="text-muted-foreground mt-2">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين</p>
          </div>

          {sent ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">تحقق من بريدك</h2>
              <p className="text-sm text-muted-foreground mb-6">
                إذا كان البريد الإلكتروني مسجلاً لدينا، ستتلقى رسالة بتعليمات إعادة تعيين كلمة المرور.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  العودة لتسجيل الدخول
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10" required />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                تذكرت كلمة المرور؟{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
