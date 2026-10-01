import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Shield, TrendingUp, Award, Users } from 'lucide-react';

export const metadata = {
  title: 'من نحن | ARA_world',
  description: 'ARA_world منصة عقارية مصرية متكاملة لبيع وشراء العقارات - فلل، شقق، أراضي، قمور. تعرف على رؤيتنا ورسالتنا في تسهيل سوق العقارات المصري.',
  keywords: ['من نحن', 'ARA world', 'منصة عقارية', 'شركة عقارات مصر', 'سوق العقارات المصري'],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 reveal">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">من نحن</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ARA_world هي منصة عقارية متكاملة تربط البائعين بالمشترين في مصر بأمان وشفافية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Shield, title: 'الأمان والثقة', desc: 'نضمن مصداقية المعلومات من خلال مراجعة احترافية لكل عقار قبل نشره' },
              { icon: TrendingUp, title: 'أسعار تنافسية', desc: 'نوفر أفضل العروض والخصومات على العقارات في مختلف المناطق' },
              { icon: Award, title: 'خدمة احترافية', desc: 'فريق متخصص لمساعدتك في كل خطوة من رحلتك العقارية' },
              { icon: Users, title: 'مجتمع متGrowing', desc: 'آلاف العملاء يثقون بنا في رحلة العثور على منزل أحلامهم' },
            ].map((item, i) => (
              <div key={i} className="reveal flex items-start gap-4 p-6 rounded-2xl border border-border bg-card" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 reveal">
            <h2 className="text-xl font-bold mb-4">رسالتنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              نسعى في ARA_world إلى أن نكون المنصة العقارية الأولى في مصر من خلال توفير تجربة بسيطة وآمنة لبيع وشراء العقارات. نؤمن بأن العثور على منزل أحلامك يجب أن يكون رحلة ممتعة وليست معقدة. لذلك نقدم أدوات بحث متقدمة، ومراجعة احترافية لكل عقار، وخدمة عملاء متميزة.
            </p>
          </div>

          <div className="mt-8 text-center reveal">
            <p className="text-sm text-muted-foreground mb-4">إخلاء المسؤولية: ARA_world هي منصة لعرض العقارات والتواصل بشأنها. ملكية العقار وحالته القانونية والعقود والمعاملات يجب التحقق منها بشكل مستقل.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
