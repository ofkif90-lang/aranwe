'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Home as HomeIcon, Tag, ArrowLeft, TrendingUp, Shield, Award, Building2, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyCard } from '@/components/property-card';
import { Property, PROPERTY_TYPE_LABELS, PropertyType } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/states';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select(`*, property_images(*)`)
        .eq('approval_status', 'approved')
        .in('status', ['available', 'reserved', 'sold'])
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(8);
      setProperties((data as Property[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchType !== 'all') params.set('type', searchType);
    router.push(`/buy?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Hero Section */}
      <section className="relative flex min-h-[100vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/properties/hero-bg.jpg"
            alt="ARA_world"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center text-white">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <span className="inline-block rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm font-medium text-white/90 mb-6 border border-white/20">
              منصة العقارات الأولى في مصر
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              ابحث عن <span className="gradient-text">عقار مناسب</span>
              <br />مع ARA_world
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              اكتشف أرقى العقارات في مصر - فلل، شقق، منازل، أراضي وأكثر. اشترِ وبع بثقة وأمان.
            </p>

            {/* Search Bar */}
            <div className="glass rounded-2xl p-4 md:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالعنوان، المدينة، أو رقم العقار (ARA-00001)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-white/90 border-0 h-12 pr-10 text-foreground"
                  />
                </div>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="md:w-48 bg-white/90 border-0 h-12 text-foreground">
                    <SelectValue placeholder="نوع العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90">
                  <Search className="h-5 w-5 ml-2" />
                  بحث
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8">
                <Link href="/buy">
                  <HomeIcon className="h-5 w-5 ml-2" />
                  تصفح العقارات
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 h-12 px-8">
                <Link href="/sell">
                  <Tag className="h-5 w-5 ml-2" />
                  بيع عقارك
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-1 text-white/50">
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-white/50 rounded-full animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: 'عقارات متاحة', value: '500+', color: 'text-primary' },
              { icon: Users, label: 'عميل سعيد', value: '1200+', color: 'text-gold' },
              { icon: Award, label: 'سنوات خبرة', value: '15+', color: 'text-primary' },
              { icon: Shield, label: 'معاملات آمنة', value: '100%', color: 'text-gold' },
            ].map((stat, i) => (
              <div
                key={i}
                className="reveal text-center"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10 reveal">
            <div>
              <span className="text-sm font-semibold text-primary mb-2 block">أحدث العقارات</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">عقارات مختارة بعناية</h2>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex">
              <Link href="/buy">
                عرض الكل
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <LoadingSkeleton className="aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-3">
                    <LoadingSkeleton className="h-5 w-3/4" />
                    <LoadingSkeleton className="h-4 w-1/2" />
                    <LoadingSkeleton className="h-8 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {properties.map((prop, i) => (
                  <PropertyCard key={prop.id} property={prop} index={i} />
                ))}
              </div>
              <div className="mt-12 text-center reveal">
                <Button asChild size="lg">
                  <Link href="/buy">
                    تصفح كل العقارات
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا توجد عقارات متاحة حالياً</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <span className="text-sm font-semibold text-primary mb-2 block">لماذا ARA_world؟</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">منصة موثوقة لعقاراتك</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'أمان وثقة', desc: 'جميع العقارات تمر بمراجعة دقيقة قبل النشر لضمان مصداقية المعلومات' },
              { icon: TrendingUp, title: 'أسعار تنافسية', desc: 'اكتشف أفضل العروض والخصومات على العقارات في مختلف المناطق' },
              { icon: Award, title: 'خدمة احترافية', desc: 'فريق متخصص لمساعدتك في كل خطوة من رحلتك العقارية' },
            ].map((feature, i) => (
              <div
                key={i}
                className="reveal text-center p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-all hover:border-primary/30"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden reveal-scale">
            <Image
              src="/properties/villa-2.jpg"
              alt="بيع عقارك"
              fill={false}
              width={1920}
              height={600}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
            <div className="relative z-10 p-12 md:p-20 text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">هل تريد بيع عقارك؟</h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                اعرض عقارك على آلاف المشترين المحتملين. عملية بسيطة وآمنة مع مراجعة احترافية.
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-10">
                <Link href="/sell">
                  <Tag className="h-5 w-5 ml-2" />
                  ابدأ البيع الآن
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
