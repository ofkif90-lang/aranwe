'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, User, Mail, Lock, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'الاسم الكامل مطلوب';
    if (!form.username.trim()) e.username = 'اسم المستخدم مطلوب';
    else if (form.username.length < 3) e.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط';
    if (!form.email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'البريد الإلكتروني غير صحيح';
    if (!form.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    if (!form.password) e.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 8) e.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'كلمات المرور غير متطابقة';
    if (!agreeTerms) e.terms = 'يجب الموافقة على الشروط والأحكام';
    if (!agreePrivacy) e.privacy = 'يجب الموافقة على سياسة الخصوصية';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            username: form.username,
            phone: form.phone,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          throw new Error('البريد الإلكتروني مسجل بالفعل');
        }
        if (msg.includes('rate limit') || msg.includes('too many')) {
          throw new Error('تم تجاوز حد المحاولات. انتظر دقيقة ثم حاول مرة أخرى');
        }
        if (msg.includes('password') && msg.includes('weak')) {
          throw new Error('كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل بمزيج من حروف وأرقام');
        }
        throw new Error(`تعذر إنشاء الحساب: ${error.message}`);
      }

      if (data.user) {
        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'مرحباً بك في ARA_world',
        });
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      toast({
        title: 'فشل إنشاء الحساب',
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
        <div className="w-full max-w-lg reveal-scale">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <UserPlus className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
            <p className="text-muted-foreground mt-2">انضم إلى ARA_world واكتشف العقارات</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pr-10" placeholder="محمد أحمد" />
                </div>
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم *</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="pr-10" placeholder="mohamed123" />
                </div>
                {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pr-10" placeholder="example@mail.com" />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pr-10" placeholder="+20 1xx xxx xxxx" />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10 pl-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="pr-10 pl-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                  أوافق على <Link href="/terms" className="text-primary hover:underline">الشروط والأحكام</Link>
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}

              <div className="flex items-start gap-2">
                <Checkbox id="privacy" checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} />
                <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer leading-relaxed">
                  أوافق على <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
                </Label>
              </div>
              {errors.privacy && <p className="text-xs text-destructive">{errors.privacy}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
