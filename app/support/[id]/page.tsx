'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, Loader2, Paperclip, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SupportTicket, TicketReply, TicketAttachment, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/lib/types';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const fetchTicket = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setTicket(data as SupportTicket);

    const { data: repliesData } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    setReplies((repliesData as TicketReply[]) ?? []);

    const { data: attachData } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', id);

    setAttachments((attachData as TicketAttachment[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter(f => ALLOWED_FILE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length < selected.length) {
      toast({ title: 'بعض الملفات رُفضت', description: 'تحقق من النوع والحجم', variant: 'destructive' });
    }
    setFiles(prev => [...prev, ...valid]);
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    setReplyLoading(true);

    try {
      const { data: reply, error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: id,
          user_id: user.id,
          sender_type: 'user',
          message: replyText,
        })
        .select()
        .single();

      if (error) throw error;

      if (files.length > 0) {
        for (const file of files) {
          const path = `support/${id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('support-attachments')
            .upload(path, file);

          if (!uploadError) {
            await supabase.from('ticket_attachments').insert({
              ticket_id: id,
              reply_id: (reply as TicketReply).id,
              file_url: path,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            });
          }
        }
      }

      await supabase.from('support_tickets')
        .update({ status: 'waiting_user', updated_at: new Date().toISOString() })
        .eq('id', id);

      setReplyText('');
      setFiles([]);
      fetchTicket();
      toast({ title: 'تم إرسال ردك' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">التذكرة غير موجودة</h1>
            <Button asChild><Link href="/contact">العودة للدعم</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/contact" className="hover:text-primary">الدعم</Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="font-mono">{ticket.ticket_number}</span>
          </nav>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
              {attachments.filter(a => !a.reply_id).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {attachments.filter(a => !a.reply_id).map(a => (
                    <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{a.file_name}</span>
                      <span className="text-xs text-muted-foreground">({(a.file_size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 mb-6">
            {replies.map((reply) => (
              <div key={reply.id} className={`flex ${reply.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${reply.sender_type === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold">
                      {reply.sender_type === 'user' ? 'أنت' : 'فريق الدعم'}
                    </span>
                    <span className="text-xs opacity-70">
                      {new Date(reply.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  {attachments.filter(a => a.reply_id === reply.id).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.filter(a => a.reply_id === reply.id).map(a => (
                        <div key={a.id} className={`flex items-center gap-2 rounded-lg p-2 text-xs ${reply.sender_type === 'user' ? 'bg-background' : 'bg-primary-foreground/10'}`}>
                          <FileText className="h-3 w-3" />
                          {a.file_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {ticket.status !== 'closed' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">إضافة رد</h3>
                <form onSubmit={submitReply} className="space-y-4">
                  <Textarea
                    rows={4}
                    placeholder="اكتب ردك هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-3">
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileSelect} className="hidden" id="reply-file-input" />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="reply-file-input" className="cursor-pointer flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> إرفاق ملفات
                      </label>
                    </Button>
                    {files.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 text-sm">
                        {f.name}
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <Button type="submit" disabled={replyLoading} className="mr-auto">
                      {replyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" />إرسال</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
