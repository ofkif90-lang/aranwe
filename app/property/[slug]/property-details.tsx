'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Share2, MapPin, BedDouble, Bath, Maximize, Layers, Calendar, Tag,
  Phone, Copy, Check, Facebook, Twitter, ChevronRight, ChevronLeft, X,
  Building2, Shield, Car, ArrowUpDown, Waves, Trees, Sofa, Zap, Wind, Dumbbell,
  ShoppingCart, Calculator, Clock, FileText, ChevronDown, ChevronUp, MessageCircle,
  Eye, User, Mail, Download, Wallet, TrendingUp, Home as HomeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Property, PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, FINISHING_TYPE_LABELS, FinishingType, PropertyLead, PaymentType, PAYMENT_TYPE_LABELS, PAYMENT_FREQUENCY_LABELS } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { PropertyCard } from '@/components/property-card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { EmptyState, LoadingSkeleton } from '@/components/states';

const amenityIcons: Record<string, typeof Shield> = {
  'أمن': Shield, 'حراسة': Shield, 'امن': Shield,
  'جراج': Car, 'مواقف': Car, 'باركينج': Car,
  'مصعد': ArrowUpDown, 'اسانسير': ArrowUpDown,
  'حمام سباحة': Waves, 'سباحة': Waves, 'pool': Waves,
  'حديقة': Trees, 'حدائق': Trees, 'garden': Trees,
  'شرفة': Building2, 'تراس': Building2, 'بلكونة': Building2,
  'مفروش': Sofa, 'أثاث': Sofa, 'اثاث': Sofa,
  'كهرباء': Zap, 'تيار': Zap,
  'تكييف': Wind, 'مكيف': Wind, 'air': Wind,
  'جيم': Dumbbell, 'صالة رياضية': Dumbbell, 'gym': Dumbbell,
};

function getAmenityIcon(feat: string) {
  const key = feat.trim().toLowerCase();
  for (const [k, v] of Object.entries(amenityIcons)) {
    if (key.includes(k.toLowerCase())) return v;
  }
  return Check;
}

export function PropertyDetails({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Lead form state
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadStep, setLeadStep] = useState(1);
  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', preferred_date: '', preferred_time: '', payment_method: 'cash', installment_years: '5', message: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);

  // Similar properties
  const [similarProps, setSimilarProps] = useState<Property[]>([]);

  // Mortgage calculator state
  const [mortgage, setMortgage] = useState({ downPayment: 20, years: 20, interestRate: 12 });

  const fetchProperty = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('properties')
      .select(`*, property_images(*)`)
      .eq('slug', slug)
      .maybeSingle();

    if (err || !data) {
      setError(true);
      setLoading(false);
      return;
    }

    const prop = data as Property;
    const isApproved = prop.approval_status === 'approved' && prop.status !== 'unpublished' && prop.published_at;
    const isOwner = user?.id === prop.owner_id;
    const isAdmin = profile?.role === 'admin';

    if (!isApproved && !isOwner && !isAdmin) {
      setError(true);
      setLoading(false);
      return;
    }

    setProperty(prop);

    if (user) {
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', prop.id)
        .maybeSingle();
      setIsFav(!!fav);
    }

    setLoading(false);
  }, [slug, user, profile]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchProperty();
  }, [fetchProperty]);

  // Fetch similar properties
  useEffect(() => {
    if (!property) return;
    (async () => {
      const minPrice = property.price * 0.7;
      const maxPrice = property.price * 1.3;
      const { data } = await supabase
        .from('properties')
        .select(`*, property_images(*)`)
        .eq('status', 'available')
        .eq('approval_status', 'approved')
        .neq('id', property.id)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('created_at', { ascending: false })
        .limit(3);
      setSimilarProps((data as Property[]) ?? []);
    })();
  }, [property?.id]);

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجل الدخول لإضافة العقار للمفضلة', variant: 'destructive' });
      return;
    }
    if (!property) return;
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', property.id);
      setIsFav(false);
      toast({ title: 'تم الإزالة من المفضلة' });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: property.id });
      setIsFav(true);
      toast({ title: 'تمت الإضافة للمفضلة' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'تم نسخ الرابط' });
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setLeadLoading(true);

    try {
      const { error: leadError } = await supabase.from('property_leads').insert({
        property_id: property.id,
        user_id: user?.id ?? null,
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email || null,
        preferred_date: leadForm.preferred_date || null,
        preferred_time: leadForm.preferred_time || null,
        payment_method: leadForm.payment_method,
        installment_years: leadForm.payment_method !== 'cash' ? parseInt(leadForm.installment_years) : null,
        message: leadForm.message || null,
        status: 'new',
      });

      if (leadError) throw leadError;

      // Notify admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((a) => ({
            user_id: a.id,
            title: 'طلب معاينة جديد',
            message: `طلب معاينة جديد لعقار "${property.title}" (${property.property_code}) من ${leadForm.name} - ${leadForm.phone}`,
            type: 'property',
            is_admin: true,
          }))
        );
      }

      toast({ title: 'تم إرسال طلبك بنجاح', description: 'سيتواصل معك مستشارنا العقاري في أقرب وقت' });
      setLeadOpen(false);
      setLeadStep(1);
      setLeadForm({ name: '', phone: '', email: '', preferred_date: '', preferred_time: '', payment_method: 'cash', installment_years: '5', message: '' });
    } catch {
      toast({ title: 'حدث خطأ', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
    } finally {
      setLeadLoading(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-EG').format(price);

  // Payment plan calculation
  const paymentPlan = (() => {
    if (!property) return null;
    const pType = property.payment_type ?? 'cash_only';
    if (pType === 'cash_only') return { type: pType, downPayment: 0, installment: 0, months: 0, frequency: 'monthly' as const };
    const downPct = property.down_payment_percentage ?? 0;
    const downAmt = property.down_payment_amount ?? (property.price * downPct / 100);
    const remaining = property.price - downAmt;
    const months = property.installment_duration_months ?? 0;
    const freq = property.payment_frequency ?? 'monthly';
    const installment = property.monthly_installment ?? (months > 0 ? remaining / months : 0);
    return { type: pType, downPayment: downAmt, installment, months, frequency: freq };
  })();

  const downloadPdfFlyer = () => {
    if (!property) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const img = images[0]?.image_url ?? '';
    const specs = [
      property.area != null ? `المساحة: ${property.area} م²` : '',
      property.bedrooms != null ? `غرف النوم: ${property.bedrooms}` : '',
      property.bathrooms != null ? `الحمامات: ${property.bathrooms}` : '',
      property.floors != null ? `الطوابق: ${property.floors}` : '',
      property.finishing_type ? `التشطيب: ${FINISHING_TYPE_LABELS[property.finishing_type as FinishingType] ?? property.finishing_type}` : '',
    ].filter(Boolean).join(' | ');

    const paymentInfo = paymentPlan ? (() => {
      if (paymentPlan.type === 'cash_only') return '<p><strong>طريقة الدفع:</strong> كاش فقط</p>';
      const parts = [`<p><strong>طريقة الدفع:</strong> ${PAYMENT_TYPE_LABELS[paymentPlan.type as PaymentType]}</p>`];
      if (paymentPlan.downPayment > 0) parts.push(`<p><strong>المقدم:</strong> ${formatPrice(paymentPlan.downPayment)} ج.م</p>`);
      if (paymentPlan.installment > 0) parts.push(`<p><strong>القسط ${PAYMENT_FREQUENCY_LABELS[paymentPlan.frequency as keyof typeof PAYMENT_FREQUENCY_LABELS]}:</strong> ${formatPrice(paymentPlan.installment)} ج.م لمدة ${paymentPlan.months} شهر</p>`);
      return parts.join('');
    })() : '';

    const featuresList = property.features?.map(f => `<li>${f}</li>`).join('') ?? '';

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${property.title} - ${property.property_code}</title>
    <style>
      *{font-family:Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
      body{padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f766e;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:28px;font-weight:bold;color:#0f766e}
      .ref{font-size:14px;color:#666}
      .img-box{width:100%;height:350px;border-radius:12px;overflow:hidden;margin-bottom:25px}
      .img-box img{width:100%;height:100%;object-fit:cover}
      h1{font-size:24px;margin-bottom:10px;color:#1a1a1a}
      .location{font-size:16px;color:#666;margin-bottom:20px}
      .price-box{background:#f0fdfa;border:1px solid #0f766e30;border-radius:12px;padding:20px;margin-bottom:20px}
      .price-box .price{font-size:32px;font-weight:bold;color:#0f766e}
      .specs{background:#f8f9fa;border-radius:10px;padding:15px;margin-bottom:20px;font-size:14px}
      .section{margin-bottom:20px}
      .section h2{font-size:18px;margin-bottom:10px;color:#0f766e}
      .section p{font-size:14px;line-height:1.8;color:#444}
      ul{padding-right:20px}
      ul li{font-size:14px;margin-bottom:4px;color:#444}
      .payment{background:#fffbeb;border:1px solid #f59e0b30;border-radius:10px;padding:15px;margin-bottom:20px;font-size:14px}
      .footer{margin-top:30px;padding-top:20px;border-top:1px solid #ddd;text-align:center;font-size:12px;color:#999}
      .contact{background:#0f766e;color:#fff;border-radius:10px;padding:15px;text-align:center;margin-bottom:20px}
      .contact p{color:#fff;font-size:14px}
    </style></head><body>
    <div class="header"><div class="logo">ARA<span style="color:#1a1a1a">_world</span></div><div class="ref">رقم العقار: ${property.property_code}</div></div>
    ${img ? `<div class="img-box"><img src="${img}" alt="${property.title}"></div>` : ''}
    <h1>${property.title}</h1>
    <p class="location">${property.city ?? ''} ${property.location ? '- ' + property.location : ''}</p>
    <div class="price-box"><div class="price">${formatPrice(property.price)} جنيه</div>${property.original_price && property.original_price > property.price ? `<div style="text-decoration:line-through;color:#999;font-size:16px">${formatPrice(property.original_price)} جنيه</div>` : ''}</div>
    <div class="specs">${specs}</div>
    ${property.description ? `<div class="section"><h2>الوصف</h2><p>${property.description}</p></div>` : ''}
    ${featuresList ? `<div class="section"><h2>الخدمات والمرافق</h2><ul>${featuresList}</ul></div>` : ''}
    <div class="payment">${paymentInfo}</div>
    <div class="contact"><p>للتواصل والمعاينة: 01559751754</p><p>تواصل عبر منصة ARA_world</p></div>
    <div class="footer">هذا الملف تعريفي عن العقار - ARA_world &copy; ${new Date().getFullYear()}</div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    w.document.close();
  };

  // Mortgage calculation
  const monthlyPayment = (() => {
    if (!property?.price) return 0;
    const principal = property.price * (1 - mortgage.downPayment / 100);
    const monthlyRate = mortgage.interestRate / 100 / 12;
    const months = mortgage.years * 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-8">
            <LoadingSkeleton className="h-96 w-full mb-6 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <LoadingSkeleton className="h-8 w-3/4" />
                <LoadingSkeleton className="h-4 w-1/2" />
                <LoadingSkeleton className="h-32 w-full" />
              </div>
              <LoadingSkeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <EmptyState
            icon={Building2}
            title="العقار غير موجود"
            description="قد يكون العقار غير متاح أو تم حذفه"
            action={<Button asChild><Link href="/buy">العودة للعقارات</Link></Button>}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.property_images ?? [];
  const isPendingView = property.approval_status !== 'approved' || !property.published_at;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${property.title} - ${property.property_code}`;
  const whatsappNumber = '+201559751754';
  const whatsappMsg = encodeURIComponent(`مرحباً ARA_world، أنا مهتم بالعقار ${property.property_code} - ${property.title}`);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
            <Link href="/" className="hover:text-primary whitespace-nowrap">الرئيسية</Link>
            <ChevronLeft className="h-3 w-3 shrink-0" />
            <Link href="/buy" className="hover:text-primary whitespace-nowrap">العقارات</Link>
            <ChevronLeft className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate">{property.title}</span>
          </nav>
        </div>

        {isPendingView && (
          <div className="container mx-auto px-4 mb-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-semibold text-amber-600">
                {property.approval_status === 'pending' && 'هذا العقار قيد المراجعة ولم يُنشر بعد'}
                {property.approval_status === 'rejected' && `هذا العقار مرفوض${property.rejection_reason ? `: ${property.rejection_reason}` : ''}`}
                {property.approval_status === 'approved' && !property.published_at && 'هذا العقار لم يُنشر بعد'}
              </p>
            </div>
          </div>
        )}

        {/* Image Gallery */}
        <div className="container mx-auto px-4 mb-8">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-auto md:h-[500px]">
              <div className="md:col-span-3 relative h-72 md:h-full rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <Image
                  src={images[activeImage]?.image_url ?? images[0].image_url}
                  alt={property.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 75vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage - 1 + images.length) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage + 1) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                  <StatusBadge status={property.status} />
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
                    {property.property_code}
                  </span>
                </div>
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 z-10">
                  <Eye className="h-3 w-3" />
                  {images.length} صور
                </div>
              </div>
              <div className="hidden md:grid grid-rows-3 gap-3 h-full">
                {images.slice(0, 3).map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`relative rounded-xl overflow-hidden transition-all ${activeImage === i ? 'ring-2 ring-primary' : ''}`}
                  >
                    <Image src={img.image_url} alt="" fill sizes="25vw" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 md:h-[500px] rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title + Location */}
              <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {PROPERTY_TYPE_LABELS[property.property_type]}
                  </span>
                  {property.is_featured && (
                    <span className="rounded-lg bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-600">مميز</span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                {(property.city || property.location) && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {property.city}{property.location ? ` - ${property.location}` : ''}
                  </p>
                )}
              </div>

              {/* Price Box */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">السعر الإجمالي</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{formatPrice(property.price)}</span>
                      <span className="text-sm text-muted-foreground">جنيه مصري</span>
                    </div>
                    {property.original_price && property.original_price > property.price && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(property.original_price)}</span>
                        {property.discount_percentage && (
                          <span className="rounded-full bg-red-500/10 text-red-500 px-2 py-0.5 text-xs font-semibold">
                            خصم {property.discount_percentage}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={toggleFavorite} className="h-10 w-10">
                      <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                      <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setShareOpen(true)}>
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <DialogContent className="sm:max-w-md">
                        <h2 className="text-lg font-bold mb-4">مشاركة العقار</h2>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleCopyLink} variant="outline" className="flex items-center gap-2">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'تم النسخ' : 'نسخ الرابط'}
                          </Button>
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent h-10 px-4 text-sm font-medium"
                          >
                            <MessageCircle className="h-4 w-4 text-[#25D366]" /> واتساب
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent h-10 px-4 text-sm font-medium"
                          >
                            <Facebook className="h-4 w-4 text-blue-600" /> فيسبوك
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent h-10 px-4 text-sm font-medium"
                          >
                            <Twitter className="h-4 w-4" /> إكس
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {/* Payment Plan Breakdown */}
              {paymentPlan && property.payment_type !== 'cash_only' && (
                <div className="bg-gradient-to-l from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    خطة السداد والتقسيط
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-4 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">سعر العقار</p>
                      <p className="text-lg font-bold">{formatPrice(property.price)} ج.م</p>
                    </div>
                    {paymentPlan.downPayment > 0 && (
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">المقدم</p>
                        <p className="text-lg font-bold text-amber-600">{formatPrice(Math.round(paymentPlan.downPayment))} ج.م</p>
                        {property.down_payment_percentage != null && (
                          <p className="text-xs text-muted-foreground">({property.down_payment_percentage}%)</p>
                        )}
                      </div>
                    )}
                    {paymentPlan.installment > 0 && paymentPlan.months > 0 && (
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">
                          القسط {PAYMENT_FREQUENCY_LABELS[paymentPlan.frequency as keyof typeof PAYMENT_FREQUENCY_LABELS]}
                        </p>
                        <p className="text-lg font-bold text-primary">{formatPrice(Math.round(paymentPlan.installment))} ج.م</p>
                        <p className="text-xs text-muted-foreground">لمدة {paymentPlan.months} شهر ({Math.round(paymentPlan.months / 12)} سنة)</p>
                      </div>
                    )}
                  </div>
                  {property.payment_type === 'cash_installments' && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      يتوفر أيضاً الدفع كاش بالكامل
                    </p>
                  )}
                </div>
              )}

              {/* Quick Specs Bar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {property.area != null && (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <Maximize className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-lg font-bold">{property.area}</div>
                    <div className="text-xs text-muted-foreground">م²</div>
                  </div>
                )}
                {property.bedrooms != null && (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <BedDouble className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-lg font-bold">{property.bedrooms}</div>
                    <div className="text-xs text-muted-foreground">غرف نوم</div>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <Bath className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-lg font-bold">{property.bathrooms}</div>
                    <div className="text-xs text-muted-foreground">حمامات</div>
                  </div>
                )}
                {property.floors != null && (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <Layers className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-lg font-bold">{property.floors}</div>
                    <div className="text-xs text-muted-foreground">طوابق</div>
                  </div>
                )}
                {property.finishing_type && (
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <Sofa className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-sm font-bold">{FINISHING_TYPE_LABELS[property.finishing_type as FinishingType] ?? property.finishing_type}</div>
                    <div className="text-xs text-muted-foreground">التشطيب</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-3">الوصف</h2>
                  <p className={`text-muted-foreground leading-relaxed whitespace-pre-wrap ${!showFullDesc && property.description.length > 300 ? 'line-clamp-4' : ''}`}>
                    {property.description}
                  </p>
                  {property.description.length > 300 && (
                    <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-primary text-sm font-medium mt-2 flex items-center gap-1">
                      {showFullDesc ? 'إخفاء' : 'قراءة المزيد'}
                      {showFullDesc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Amenities / Features */}
              {property.features && property.features.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">الخدمات والمرافق</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feat, i) => {
                      const Icon = getAmenityIcon(feat);
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm bg-background rounded-lg p-2.5 border border-border/50">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span>{feat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Floor Plan */}
              {property.floor_plan_url && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">المخطط الهندسي</h2>
                  <div className="relative h-96 rounded-xl overflow-hidden">
                    <Image src={property.floor_plan_url} alt="مخطط العقار" fill sizes="100%" className="object-contain" />
                  </div>
                </div>
              )}

              {/* Interactive Map */}
              {property.map_lat != null && property.map_lng != null && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">الموقع على الخريطة</h2>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.map_lng! - 0.01},${property.map_lat! - 0.01},${property.map_lng! + 0.01},${property.map_lat! + 0.01}&marker=${property.map_lat},${property.map_lng}`}
                      className="w-full h-80 border-0"
                      loading="lazy"
                      title="موقع العقار"
                    />
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${property.map_lat}&mlon=${property.map_lng}#map=15/${property.map_lat}/${property.map_lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary text-sm font-medium mt-2 inline-block"
                  >
                    فتح في خرائط أكبر
                  </a>
                </div>
              )}

              {/* Mortgage Calculator */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  حاسبة التمويل العقاري
                </h2>
                <p className="text-sm text-muted-foreground mb-4">احسب القسط الشهري التقريبي قبل الشراء</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-xs">مقدم الشراء (%)</Label>
                    <Input
                      type="number" min={0} max={100}
                      value={mortgage.downPayment}
                      onChange={(e) => setMortgage({ ...mortgage, downPayment: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">مدة السداد (سنة)</Label>
                    <Select value={String(mortgage.years)} onValueChange={(v) => setMortgage({ ...mortgage, years: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 30].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y} سنة</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">معدل الفائدة (%)</Label>
                    <Input
                      type="number" min={0} step={0.5}
                      value={mortgage.interestRate}
                      onChange={(e) => setMortgage({ ...mortgage, interestRate: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-primary/5 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">مقدم الشراء</p>
                    <p className="text-lg font-bold text-foreground">{formatPrice(property.price * mortgage.downPayment / 100)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">مبلغ القرض</p>
                    <p className="text-lg font-bold text-foreground">{formatPrice(property.price * (1 - mortgage.downPayment / 100))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">القسط الشهري</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(Math.round(monthlyPayment))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Sidebar - Lead Capture (Brokerage Model) */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-2">مهتم بهذا العقار؟</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  تواصل مع مستشارنا العقاري لتحديد موعد معاينة. المعاينة تكون برفقة ممثل عن الموقع لضمان حقوق الجميع.
                </p>

                {/* Property status badge */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">حالة العقار: </span>
                  <StatusBadge status={property.status} />
                </div>

                <div className="space-y-3">
                  {/* Main CTA: Lead form */}
                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    onClick={() => {
                      if (user) {
                        setLeadForm({ ...leadForm, name: profile?.full_name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '' });
                      }
                      setLeadOpen(true);
                    }}
                  >
                    <Eye className="h-5 w-5 ml-2" />
                    طلب معاينة / تواصل مع المستشار
                  </Button>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-[#25D366] text-white font-medium hover:bg-[#25D366]/90 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    تواصل عبر واتساب
                  </a>

                  {/* Phone */}
                  <a
                    href={`tel:${whatsappNumber}`}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-input bg-background hover:bg-accent font-medium transition-colors"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    اتصل بنا
                  </a>

                  {/* PDF Flyer */}
                  <Button variant="outline" className="w-full h-11" onClick={downloadPdfFlyer}>
                    <Download className="h-4 w-4 ml-2" />
                    تحميل ملف العقار (PDF)
                  </Button>
                </div>

                {/* Privacy notice */}
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>بيانات المالك غير مباشرة. المعاينة والتواصل تتم عبر منصة ARA_world لحماية حقوق الجميع.</span>
                  </div>
                </div>

                {/* Property quick info */}
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">رقم العقار</span>
                    <span className="font-semibold">{property.property_code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">النوع</span>
                    <span className="font-semibold">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
                  </div>
                  {property.published_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />تاريخ النشر</span>
                      <span className="font-semibold">{new Date(property.published_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProps.length > 0 && (
          <div className="container mx-auto px-4 mt-12 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-primary" />
              عقارات مشابهة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProps.map((prop, i) => (
                <PropertyCard key={prop.id} property={prop} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && images.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-10" onClick={() => setLightboxOpen(false)}>
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-5xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
              <Image src={images[activeImage]?.image_url ?? images[0].image_url} alt={property.title} fill sizes="100vw" className="object-contain" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setActiveImage((activeImage + 1) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm">
                    {activeImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Lead Capture Dialog - Multi-step */}
      <Dialog open={leadOpen} onOpenChange={(open) => { setLeadOpen(open); if (!open) setLeadStep(1); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طلب معاينة العقار - {property.property_code}</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 text-sm ${leadStep >= 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${leadStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</span>
              بياناتك
            </div>
            <div className={`flex-1 h-0.5 ${leadStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-1.5 text-sm ${leadStep >= 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${leadStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</span>
              المعاينة والدفع
            </div>
          </div>

          <form onSubmit={submitLead} className="space-y-3">
            {leadStep === 1 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">املأ بياناتك الأساسية ليتواصل معك مستشارنا العقاري.</p>
                <div className="space-y-2">
                  <Label htmlFor="lead-name">الاسم بالكامل *</Label>
                  <Input id="lead-name" required value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="الاسم بالكامل" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lead-phone">رقم الهاتف *</Label>
                    <Input id="lead-phone" type="tel" required value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="01xxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-email">البريد الإلكتروني</Label>
                    <Input id="lead-email" type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="example@mail.com" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setLeadOpen(false)}>إلغاء</Button>
                  <Button type="button" onClick={() => setLeadStep(2)} disabled={!leadForm.name || !leadForm.phone}>
                    التالي
                  </Button>
                </DialogFooter>
              </>
            )}

            {leadStep === 2 && (
              <>
                <p className="text-sm text-muted-foreground mb-2">اختر موعد المعاينة وطريقة الدفع المفضلة.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lead-date">التاريخ المفضل للمعاينة</Label>
                    <Input id="lead-date" type="date" value={leadForm.preferred_date} onChange={(e) => setLeadForm({ ...leadForm, preferred_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-time">الوقت المفضل</Label>
                    <Select value={leadForm.preferred_time} onValueChange={(v) => setLeadForm({ ...leadForm, preferred_time: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر الوقت" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">صباحاً</SelectItem>
                        <SelectItem value="noon">ظهراً</SelectItem>
                        <SelectItem value="afternoon">عصراً</SelectItem>
                        <SelectItem value="evening">مساءً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-payment">طريقة الدفع المفضلة *</Label>
                  <Select value={leadForm.payment_method} onValueChange={(v) => setLeadForm({ ...leadForm, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">كاش</SelectItem>
                      <SelectItem value="installments">تقسيط</SelectItem>
                      <SelectItem value="mortgage">تمويل عقاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {leadForm.payment_method === 'installments' && (
                  <div className="space-y-2">
                    <Label htmlFor="lead-years">مدة التقسيط (سنوات)</Label>
                    <Select value={leadForm.installment_years} onValueChange={(v) => setLeadForm({ ...leadForm, installment_years: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y} سنة</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="lead-message">ملاحظات إضافية</Label>
                  <Textarea id="lead-message" rows={2} value={leadForm.message} onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })} placeholder="أي معلومات إضافية..." />
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700">
                  <p className="font-semibold mb-1">إقرار المعاينة:</p>
                  <p>بتقديم هذا الطلب، توافق على أن المعاينة تتم برفقة ممثل من ARA_world، وأنك تعرفت على هذا العقار عن طريق المنصة، وفي حال الشراء تلتزم بدفع العمولة المتفق عليها.</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setLeadStep(1)}>رجوع</Button>
                  <Button type="submit" disabled={leadLoading}>
                    {leadLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
