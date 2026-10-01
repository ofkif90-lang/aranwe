import Link from 'next/link';
import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-lg">
                A
              </div>
              <span className="text-xl font-bold">ARA<span className="text-primary">_world</span></span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              منصة عقارية متكاملة لبيع وشراء الفلل والمنازل والشقق والأراضي في مصر. نربط البائعين بالمشترين بأمان وشفافية.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white">روابط سريعة</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
              <li><Link href="/buy" className="hover:text-primary transition-colors">شراء عقار</Link></li>
              <li><Link href="/sell" className="hover:text-primary transition-colors">بيع عقار</Link></li>
              <li><Link href="/favorites" className="hover:text-primary transition-colors">المفضلة</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white">معلومات قانونية</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+20 155 975 1754</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@ara-world.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>القاهرة، مصر</span>
              </li>
              <li>
                <a
                  href="https://wa.me/201559751754"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366]/20 px-3 py-2 text-[#25D366] transition-colors hover:bg-[#25D366]/30"
                >
                  <MessageCircle className="h-4 w-4" />
                  واتساب
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/50">
          <p>
            ARA_world هي منصة لعرض العقارات والتواصل بشأنها. ملكية العقار وحالته القانونية والعقود والمعاملات يجب التحقق منها بشكل مستقل.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} ARA_world. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
