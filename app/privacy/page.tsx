import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'سياسة الخصوصية | ARA_world',
  description: 'سياسة الخصوصية لمنصة ARA_world العقارية - كيفية حماية بياناتك الشخصية ومعلوماتك عند استخدام منصتنا لبيع وشراء العقارات.',
  keywords: ['سياسة الخصوصية', 'حماية البيانات', 'ARA world', 'خصوصية المستخدمين'],
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 leading-relaxed">
            <p>تحدد سياسة الخصوصية هذه كيفية جمع ARA_world واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">المعلومات التي نجمعها</h2>
            <p>نجمع المعلومات التي تقدمها عند إنشاء حساب،包括 الاسم، البريد الإلكتروني، رقم الهاتف، واسم المستخدم. كما نجمع معلومات حول العقارات التي تعرضها للبيع.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">استخدام المعلومات</h2>
            <p>نستخدم معلوماتك لتقديم خدماتنا، وإدارة حسابك، والتواصل معك بشأن طلباتك وعقاراتك، وتحسين منصتنا.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">حماية البيانات</h2>
            <p>نستخدم إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به. يتم تخزين كلمات المرور بشكل مشفر ولا يتم عرضها أبداً.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">مشاركة المعلومات</h2>
            <p>لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا عند الضرورة القانونية أو بموافقتك الصريحة.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">حقوقك</h2>
            <p>لك الحق في الوصول إلى معلوماتك وتصحيحها وطلب حذفها. يمكنك التواصل معنا في أي وقت لممارسة هذه الحقوق.</p>

            <h2 className="text-xl font-bold text-foreground mt-6 mb-3">إخلاء المسؤولية</h2>
            <p>ARA_world هي منصة لعرض العقارات والتواصل بشأنها. ملكية العقار وحالته القانونية والعقود والمعاملات يجب التحقق منها بشكل مستقل. لا تتحمل ARA_world أي مسؤولية عن صحة المعلومات المقدمة من المستخدمين.</p>

            <p className="text-sm mt-6">آخر تحديث: {new Date().getFullYear()}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
