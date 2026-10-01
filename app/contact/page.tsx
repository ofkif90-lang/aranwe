'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageCircle, MapPin, Send, Loader2, Paperclip, X, FileText, CheckCircle2, Inbox, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SupportTicket, TicketCategory, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/lib/types';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

interface UploadedFile {
  file: File;
  url: string;
  path: string;
  preview?: string;
}

export default function ContactPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [form, setForm] = useState({
    name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    category: 'general_inquiry' as TicketCategory,
    subject: '',
    description: '',
  });

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setTicketsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets((data as SupportTicket[]) ?? []);
    setTicketsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone ?? '',
      }));
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid: UploadedFile[] = [];

    for (const file of selected) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({ title: 'نوع ملف غير مدعوم', description: `${file.name}: يُسمح بـ JPG, PNG, WebP, PDF فقط`, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'حجم ملف كبير', description: `${file.name}: الحد الأقصى 10 ميجابايت`, variant: 'destructive' });
        continue;
      }
      if (files.length + valid.length >= MAX_FILES) {
        toast({ title: 'الحد الأقصى للملفات', description: `يمكنك رفع ${MAX_FILES} ملفات كحد أقصى`, variant: 'destructive' });
        break;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      const path = `support/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
      valid.push({ file, url: '', path, preview });
    }

    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id ?? null,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          category: form.category,
          subject: form.subject,
          description: form.description,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      const ticketId = (ticket as SupportTicket).id;
      const ticketNumber = (ticket as SupportTicket).ticket_number;

      if (files.length > 0) {
        for (const f of files) {
          const { error: uploadError } = await supabase.storage
            .from('support-attachments')
            .upload(f.path, f.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('support-attachments')
            .getPublicUrl(f.path);

          await supabase.from('ticket_attachments').insert({
            ticket_id: ticketId,
            file_url: f.path,
            file_name: f.file.name,
            file_type: f.file.type,
            file_size: f.file.size,
          });
        }
      }

      await supabase.from('notifications').insert({
        user_id: null,
        title: 'تذكرة دعم جديدة',
        message: `تذكرة دعم جديدة: ${ticketNumber} - ${form.subject}`,
        type: 'system',
        is_admin: true,
      });

      setSubmittedTicket(ticketNumber);
      setShowForm(false);
      setForm({ ...form, subject: '', description: '', category: 'general_inquiry' });
      setFiles([]);
      fetchTickets();
    } catch {
      toast({ title: 'حدث خطأ', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10 reveal">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">كيف يمكننا مساعدتك؟</h1>
            <p className="text-muted-foreground">فريق الدعم متاح لمساعدتك في أي مشكلة أو استفسار</p>
          </div>

          {submittedTicket && (
            <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 reveal-scale">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-700">تم استلام طلبك بنجاح</h3>
                  <p className="text-sm text-green-600">
                    رقم التذكرة: <span className="font-mono font-bold">{submittedTicket}</span>
                    <br />
                    سيتواصل معك فريق الدعم في أقرب وقت ممكن.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mr-auto" onClick={() => setSubmittedTicket(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Phone, title: 'الهاتف', value: '+20 155 975 1754', color: 'text-primary' },
              { icon: Mail, title: 'البريد الإلكتروني', value: 'contact@ara-world.com', color: 'text-gold' },
              { icon: MapPin, title: 'العنوان', value: 'القاهرة، مصر', color: 'text-primary' },
            ].map((item, i) => (
              <Card key={i} className="reveal text-center" style={{ transitionDelay: `${i * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                    <item.icon className={`h-7 w-7 ${item.color}`} />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="reveal-right">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">تذكرة دعم جديدة</h2>
                    {user && (
                      <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'إلغاء' : 'فتح النموذج'}
                      </Button>
                    )}
                  </div>

                  {!user ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">يجب تسجيل الدخول لإنشاء تذكرة دعم</p>
                      <div className="flex gap-3 justify-center">
                        <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
                        <Button asChild variant="outline"><Link href="/register">إنشاء حساب</Link></Button>
                      </div>
                    </div>
                  ) : showForm ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">الاسم *</Label>
                          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">البريد الإلكتروني *</Label>
                          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>الفئة *</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as TicketCategory })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">الموضوع *</Label>
                        <Input id="subject" required placeholder="وصف مختصر للمشكلة" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">وصف المشكلة *</Label>
                        <Textarea id="description" rows={5} required placeholder="اشرح المشكلة بالتفصيل..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <Label>المرفقات (اختياري)</Label>
                        <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                          <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">JPG, PNG, WebP, PDF — حتى 10 ميجابايت</p>
                          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileSelect} className="hidden" id="file-input" />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="file-input" className="cursor-pointer">اختيار ملفات</label>
                          </Button>
                        </div>
                        {files.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {files.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-2">
                                {f.preview ? (
                                  <img src={f.preview} alt="" className="h-10 w-10 rounded object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="text-sm flex-1 truncate">{f.file.name}</span>
                                <span className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</span>
                                <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" />إرسال التذكرة</>}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground">اضغط "فتح النموذج" لإنشاء تذكرة دعم جديدة</p>
                  )}
                </CardContent>
              </Card>

              <a
                href="https://wa.me/201559751754?text=مرحباً ARA_world"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 p-6 hover:bg-[#25D366]/20 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">واتساب</h3>
                  <p className="text-sm text-muted-foreground">تواصل فوري عبر واتساب</p>
                </div>
              </a>
            </div>

            <div className="space-y-4">
              {user && (
                <Card className="reveal-left">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Inbox className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">تذاكري</h2>
                    </div>
                    {ticketsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : tickets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">لا توجد تذاكر دعم بعد</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {tickets.map((ticket) => (
                          <Link
                            key={ticket.id}
                            href={`/support/${ticket.id}`}
                            className="block rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                {TICKET_STATUS_LABELS[ticket.status]}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm mb-1 truncate">{ticket.subject}</h4>
                            <p className="text-xs text-muted-foreground">{TICKET_CATEGORY_LABELS[ticket.category]}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3">ساعات العمل</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">السبت - الخميس</span><span>9:00 - 18:00</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">الجمعة</span><span>مغلق</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
