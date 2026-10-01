import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'الشروط والأحكام | ARA_world',
  description: 'الشروط والأحكام لاستخدام منصة ARA_world العقارية - قواعد بيع وشراء العقارات واستخدام المنصة.',
  keywords: ['الشروط والأحكام', 'ARA world', 'قواعد الاستخدام', 'منصة عقارية'],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">الشروط والأحكام</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 leading-relaxed">
            <p>باستخدامك لمنصة ARA_world، فإنك توافق على الشروط والأحكام التالية:</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">قبول الشروط</h2>
            <p>استخدامك للمنصة يعني موافقتك على هذه الشروط. إذا كنت لا توافق، يرجى عدم استخدام المنصة.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">التسجيل والحساب</h2>
            <p>يجب تقديم معلومات صحيحة عند التسجيل. أنت مسؤول عن الحفاظ على سرية كلمة المرور وعن جميع الأنشطة التي تتم باستخدام حسابك.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">عرض العقارات</h2>
            <p>عند عرض عقار للبيع، يجب تقديم معلومات صحيحة ودقيقة. تخضع جميع العقارات لمراجعة الإدارة قبل النشر. نحتفظ بحق رفض أو حذف أي إعلان مخالف.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">استخدام المنصة</h2>
            <p>يحظر استخدام المنصة لأي أغراض غير قانونية أو ضارة. لا يجوز نشر محتوى مسيء أو مضلل أو ينتهك حقوق الآخرين.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">المعاملات</h2>
            <p>ARA_world هي منصة وسيطة لعرض العقارات. لا نشارك في المعاملات المالية بين الأطراف. ملكية العقار وحالته القانونية يجب التحقق منها بشكل مستقل.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">إخلاء المسؤولية</h2>
            <p>تقدم المنصة "كما هي" دون ضمانات. لا تتحمل ARA_world مسؤولية أي خسائر أو أضرار ناتجة عن استخدام المنصة أو المعاملات بين المستخدمين.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">المدفوعات</h2>
            <p>أي مدفوعات تتم عبر المنصة هي رسوم خدمة فقط ولا تمثل دفعة مقابل ملكية العقار. المعاملات العقارية الفعلية تتم بشكل مستقل.</p>

            <p className="text-sm mt-6">آخر تحديث: {new Date().getFullYear()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
