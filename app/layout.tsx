import './globals.css';
import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { ScrollReveal } from '@/components/scroll-reveal';

const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['300', '400', '500', '600', '700', '800'] });
const tajawal = Tajawal({ subsets: ['arabic', 'latin'], weight: ['300', '400', '500', '700', '800'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ara-world.com'),
  title: {
    default: 'ARA_world | بيع وشراء العقارات في مصر - فلل، شقق، أراضي',
    template: '%s | ARA_world',
  },
  description: 'ARA_world منصة عقارية متكاملة لبيع وشراء الفلل والمنازل والشقق والأراضي والقمور في مصر. تصفح عقارات للبيع بأفضل الأسعار، اعرض عقارك للبيع مجاناً، تواصل مباشر مع البائعين.',
  keywords: [
    'بيع عقارات مصر',
    'شراء عقارات',
    'فلل للبيع',
    'شقق للبيع',
    'أراضي للبيع',
    'قمور للبيع',
    'عقارات التجمع الخامس',
    'عقارات القاهرة الجديدة',
    'عقارات الإسكندرية',
    'عقارات 6 أكتوبر',
    'عقارات الشيخ زايد',
    'منازل للبيع',
    'عقارات للبيع في مصر',
    'بيع فيلا',
    'بيع شقة',
    'بيع أرض',
    'سوق العقارات المصري',
    'عقارات بأسعار مناسبة',
    'استثمار عقاري',
    'تخفيضات عقارات',
    'عقارات بخصم',
    'ARA world',
    'منصة عقارية',
    'إعلان عقار للبيع',
    'بيع عقارك',
  ],
  authors: [{ name: 'ARA_world' }],
  creator: 'ARA_world',
  publisher: 'ARA_world',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ARA_world | بيع وشراء العقارات في مصر - فلل، شقق، أراضي',
    description: 'منصة عقارية متكاملة لبيع وشراء الفلل والمنازل والشقق والأراضي في مصر بأفضل الأسعار. اعرض عقارك للبيع مجاناً.',
    type: 'website',
    locale: 'ar_EG',
    siteName: 'ARA_world',
    url: 'https://ara-world.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARA_world | بيع وشراء العقارات في مصر',
    description: 'منصة عقارية متكاملة لبيع وشراء العقارات في مصر - فلل، شقق، أراضي، قمور',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'real estate',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'ARA_world',
  description: 'منصة عقارية متكاملة لبيع وشراء العقارات في مصر',
  url: 'https://ara-world.com',
  areaServed: 'مصر',
  knowsLanguage: 'ar',
  knowsAbout: [
    'بيع العقارات',
    'شراء العقارات',
    'فلل للبيع',
    'شقق للبيع',
    'أراضي للبيع',
    'قمور للبيع',
    'عقارات التجمع الخامس',
    'عقارات القاهرة الجديدة',
    'عقارات الإسكندرية',
    'عقارات 6 أكتوبر',
  ],
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={cairo.className}>
        <AuthProvider>
          <ScrollReveal />
          {children}
          <WhatsAppButton />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
