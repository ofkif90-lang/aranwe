import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تصفح العقارات للبيع | فلل، شقق، أراضي',
  description: 'تصفح أفضل العقارات للبيع في مصر - فلل، شقق، أراضي، قمور في التجمع الخامس، الشيخ زايد، 6 أكتوبر، الإسكندرية والقاهرة الجديدة بأفضل الأسعار.',
  keywords: [
    'عقارات للبيع',
    'فلل للبيع',
    'شقق للبيع',
    'أراضي للبيع',
    'قمور للبيع',
    'عقارات التجمع الخامس',
    'عقارات الشيخ زايد',
    'عقارات 6 أكتوبر',
    'عقارات القاهرة الجديدة',
    'عقارات الإسكندرية',
    'شراء عقار',
    'تصفح العقارات',
  ],
  alternates: { canonical: '/buy' },
  openGraph: {
    title: 'تصفح العقارات للبيع في مصر | ARA_world',
    description: 'فلل، شقق، أراضي، قمور للبيع بأفضل الأسعار في مصر',
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
