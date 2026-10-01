import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق ARA_world للاستفسار عن العقارات، بيع وشراء العقارات في مصر، أو الدعم الفني.',
  keywords: [
    'تواصل مع ARA world',
    'استفسار عقارات',
    'دعم عقاري',
    'اتصال بمنصة عقارية',
    'شركة عقارات مصر',
  ],
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
