'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, X, ImagePlus, Tag, Loader2, CheckCircle2, MapPin, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { PROPERTY_TYPE_LABELS, PropertyType, FINISHING_TYPE_LABELS, FinishingType, PAYMENT_TYPE_LABELS, PAYMENT_FREQUENCY_LABELS, PaymentType, PaymentFrequency } from '@/lib/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function SellPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    property_type: 'villa',
    address: '',
    city: '',
    location: '',
    price: '',
    original_price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    finishing_type: 'semi_lux',
    description: '',
    phone: '',
    payment_type: 'cash_only',
    down_payment_percentage: '',
    installment_duration_months: '',
    payment_frequency: 'monthly',
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast({ title: 'نوع ملف غير صحيح', description: `${f.name} ليس صورة`, variant: 'destructive' });
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: 'حجم كبير', description: `${f.name} أكبر من 5 ميجابايت`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    const remaining = MAX_IMAGES - images.length;
    if (validFiles.length > remaining) {
      toast({ title: 'حد أقصى للصور', description: `يمكنك رفع ${remaining} صور فقط`, variant: 'destructive' });
    }

    const toAdd = validFiles.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
  }, [images.length, toast]);

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addFeature = () => {
    const f = featureInput.trim();
    if (f && !features.includes(f)) {
      setFeatures((prev) => [...prev, f]);
      setFeatureInput('');
    }
  };

  const removeFeature = (f: string) => setFeatures((prev) => prev.filter((x) => x !== f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.title || !form.price || !form.city || images.length === 0) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى ملء جميع الحقول المطلوبة وإضافة صورة واحدة على الأقل', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const isAdmin = profile?.role === 'admin';
      const { data: codeData, error: codeError } = await supabase.rpc('generate_property_code');
      if (codeError || !codeData) {
        toast({ title: 'حدث خطأ', description: 'تعذر إنشاء رقم العقار. يرجى المحاولة مرة أخرى.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const propertyCode = codeData as string;
      const baseSlug = form.title.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');
      let slug = baseSlug || `property-${Date.now()}`;
      let slugSuffix = 0;
      while (true) {
        const { data: existing, error: slugError } = await supabase.from('properties').select('id').eq('slug', slug).maybeSingle();
        if (slugError) throw slugError;
        if (!existing) break;
        slugSuffix++;
        slug = `${baseSlug}-${slugSuffix}`;
      }

      const propertyId = crypto.randomUUID();
      const { error: propError } = await supabase.from('properties').insert({
        id: propertyId,
        property_code: propertyCode,
        owner_id: user.id,
        title: form.title,
        slug,
        property_type: form.property_type,
        address: form.address || null,
        city: form.city,
        location: form.location || null,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        discount_amount: form.original_price && parseFloat(form.original_price) > parseFloat(form.price)
          ? parseFloat(form.original_price) - parseFloat(form.price) : null,
        discount_percentage: form.original_price && parseFloat(form.original_price) > parseFloat(form.price)
          ? ((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price) * 100) : null,
        area: form.area ? parseFloat(form.area) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        finishing_type: form.finishing_type || null,
        payment_type: form.payment_type,
        down_payment_percentage: form.payment_type !== 'cash_only' && form.down_payment_percentage ? parseFloat(form.down_payment_percentage) : null,
        installment_duration_months: form.payment_type !== 'cash_only' && form.installment_duration_months ? parseInt(form.installment_duration_months) : null,
        payment_frequency: form.payment_type !== 'cash_only' ? form.payment_frequency : 'monthly',
        monthly_installment: form.payment_type !== 'cash_only' && form.down_payment_percentage && form.installment_duration_months
          ? (parseFloat(form.price) * (1 - parseFloat(form.down_payment_percentage) / 100) / parseInt(form.installment_duration_months))
          : null,
        description: form.description || null,
        features: features.length > 0 ? features : null,
        status: isAdmin ? 'available' : 'unpublished',
        approval_status: isAdmin ? 'approved' : 'pending',
        published_at: isAdmin ? new Date().toISOString() : null,
      }).select().single();

      if (propError) {
        console.error('Property save failed:', propError);
        toast({ title: 'تعذر حفظ بيانات العقار', description: 'يرجى التأكد من تسجيل الدخول ثم المحاولة مرة أخرى.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { error: contactError } = await supabase.from('property_contact_details').insert({
        property_id: propertyId,
        contact_phone: form.phone,
      });
      if (contactError) {
        console.error('Property contact save failed:', contactError);
        toast({ title: 'تعذر حفظ رقم التواصل', description: 'يرجى المحاولة مرة أخرى.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const uploadResults = await Promise.all(images.map(async (img, i) => {
        const file = img.file;
        const ext = file.name.split('.').pop();
        const fileName = `${propertyId}/${i}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);
        if (uploadError) throw new Error(`Image ${i + 1} upload failed`);
        const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);
        return { property_id: propertyId, image_url: urlData.publicUrl, is_main: i === 0, display_order: i };
      }));
      const imageInserts = uploadResults;

      if (imageInserts.length > 0) {
        const { error: imgError } = await supabase.from('property_images').insert(imageInserts);
        if (imgError) {
          console.error('Property images save failed:', imgError);
          toast({ title: 'تعذر حفظ الصور', description: 'لم نتمكن من ربط الصور بالعقار. يرجى المحاولة مرة أخرى.', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      if (!isAdmin) {
        const { error: srError } = await supabase.from('sell_requests').insert({
          property_id: propertyId,
          user_id: user.id,
          status: 'pending',
        });
        if (srError) {
          console.error('Sell request creation failed:', srError);
          toast({ title: 'تعذر إرسال طلب البيع', description: 'لم نتمكن من إنشاء طلب المراجعة. يرجى المحاولة مرة أخرى.', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: isAdmin ? 'تم نشر عقارك' : 'تم استلام طلبك',
        message: isAdmin
          ? `تم نشر عقارك "${form.title}" مباشرة. رقم العقار: ${propertyCode}`
          : `تم استلام طلب بيع العقار "${form.title}" وسيتم مراجعته قريباً. رقم العقار: ${propertyCode}`,
        type: 'property',
      });

      toast({ title: isAdmin ? 'تم نشر العقار بنجاح' : 'تم إرسال الطلب بنجاح', description: `رقم العقار: ${propertyCode}.` });
      router.push(isAdmin ? '/admin/properties' : '/');
    } catch (err) {
      console.error('Sell property submission failed:', err);
      toast({ title: 'تعذر إرسال العقار', description: 'حدثت مشكلة أثناء الإرسال. يرجى المحاولة مرة أخرى.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
          <div className="max-w-md text-center reveal-scale">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Tag className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">سجل الدخول لبيع عقارك</h1>
            <p className="text-muted-foreground mb-6">يجب تسجيل الدخول لعرض عقارك للبيع</p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
              <Button asChild variant="outline"><Link href="/register">إنشاء حساب</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 reveal">
            <h1 className="text-3xl font-bold mb-2">عرض عقار للبيع</h1>
            <p className="text-muted-foreground">املأ تفاصيل عقارك وسيتم مراجعتها من قبل الإدارة قبل النشر</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-2xl p-6 reveal">
              <h2 className="text-lg font-bold mb-4">المعلومات الأساسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">عنوان العقار *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: فيلا مستقلة بحديقة - التجمع الخامس" required />
                </div>

                <div className="space-y-2">
                  <Label>نوع العقار *</Label>
                  <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">المدينة *</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="مثال: القاهرة الجديدة" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">المنطقة</Label>
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="مثال: التجمع الخامس، الشيخ زايد، 6 أكتوبر" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان التفصيلي</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="مثال: شارع التسعين الشمالي، عمارة 12" />
                </div>
              </div>
            </div>

            {/* Price & Area */}
            <div className="bg-card border border-border rounded-2xl p-6 reveal">
              <h2 className="text-lg font-bold mb-4">السعر والمساحة</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (جنيه) *</Label>
                  <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="مثال: 5000000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">السعر الأصلي (اختياري)</Label>
                  <Input id="original_price" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="مثال: 6000000 (لو فيه خصم)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">المساحة (م²)</Label>
                  <Input id="area" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="مثال: 300" />
                </div>
              </div>
            </div>

            {/* Payment Plan */}
            <div className="bg-card border border-border rounded-2xl p-6 reveal">
              <h2 className="text-lg font-bold mb-4">طريقة الدفع</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>نوع الدفع *</Label>
                  <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.payment_type !== 'cash_only' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="down_payment">نسبة المقدم (%)</Label>
                      <Input id="down_payment" type="number" min={0} max={100} value={form.down_payment_percentage} onChange={(e) => setForm({ ...form, down_payment_percentage: e.target.value })} placeholder="مثال: 20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">مدة التقسيط (شهر)</Label>
                      <Input id="duration" type="number" value={form.installment_duration_months} onChange={(e) => setForm({ ...form, installment_duration_months: e.target.value })} placeholder="مثال: 60 (5 سنوات)" />
                    </div>
                    <div className="space-y-2">
                      <Label>تكرار الدفع</Label>
                      <Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.price && form.down_payment_percentage && form.installment_duration_months && (
                      <div className="md:col-span-3 bg-primary/5 rounded-lg p-3 text-sm">
                        <span className="text-muted-foreground">القسط التقريبي: </span>
                        <span className="font-bold text-primary">
                          {new Intl.NumberFormat('ar-EG').format(Math.round(
                            parseFloat(form.price) * (1 - parseFloat(form.down_payment_percentage) / 100) / parseInt(form.installment_duration_months)
                          ))} ج.م
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-card border border-border rounded-2xl p-6 reveal">
              <h2 className="text-lg font-bold mb-4">التفاصيل</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">غرف النوم</Label>
                  <Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="مثال: 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">الحمامات</Label>
                  <Input id="bathrooms" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="مثال: 2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floors">عدد الطوابق</Label>
                  <Input id="floors" type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} placeholder="مثال: 1" />
                </div>
                <div className="space-y-2">
                  <Label>نوع التشطيب</Label>
                  <Select value={form.finishing_type} onValueChange={(v) => setForm({ ...form, finishing_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FINISHING_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea id="description" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="اكتب وصف تفصيلي للعقار: المميزات، التشطيبات، الموقع، القرب من الخدمات..." />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="phone">رقم الهاتف للتواصل *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="مثال: 01012345678" required />
                </div>
              </div>

              {/* Features */}
              <div className="mt-4">
                <Label>المميزات</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    placeholder="أضف ميزة واضغط إضافة (مثال: حمام سباحة، جرااج، حديقة)"
                  />
                  <Button type="button" onClick={addFeature} variant="outline">إضافة</Button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {features.map((f) => (
                      <span key={f} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
                        {f}
                        <button type="button" onClick={() => removeFeature(f)}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-card border border-border rounded-2xl p-6 reveal">
              <h2 className="text-lg font-bold mb-4">صور العقار *</h2>
              <p className="text-sm text-muted-foreground mb-4">حد أقصى {MAX_IMAGES} صور، كل صورة بحد أقصى 5 ميجابايت. الصيغ: JPG, PNG, WebP</p>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">اضغط لاختيار الصور</span>
                <span className="text-xs text-muted-foreground mt-1">{images.length}/{MAX_IMAGES} صور</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageUpload} />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">رئيسية</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button asChild type="button" variant="outline">
                <Link href="/">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={loading} size="lg">
                {loading ? (
                  <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> جاري الإرسال...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 ml-2" /> إرسال للمراجعة</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
