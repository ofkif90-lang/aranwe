'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Inbox, Loader2, Reply, X, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { SupportTicket, TicketReply, TicketAttachment, TicketStatus, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/lib/types';
import { EmptyState } from '@/components/states';

export default function AdminSupportTicketsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data } = await query;
    setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    if (profile?.role === 'admin') fetchTickets();
  }, [profile, fetchTickets]);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes ?? '');

    const { data: repliesData } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    setReplies((repliesData as TicketReply[]) ?? []);

    const { data: attachData } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticket.id);
    setAttachments((attachData as TicketAttachment[]) ?? []);

    setDetailOpen(true);
  };

  const updateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await supabase.from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);

      if (selectedTicket.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedTicket.user_id,
          title: 'تحديث تذكرة الدعم',
          message: `تم تحديث تذكرتك ${selectedTicket.ticket_number} إلى: ${TICKET_STATUS_LABELS[status]}`,
          type: 'info',
        });
      }

      setSelectedTicket({ ...selectedTicket, status });
      toast({ title: 'تم تحديث حالة التذكرة' });
      fetchTickets();
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !profile) return;
    setActionLoading(true);
    try {
      await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicket.id,
        user_id: profile.id,
        sender_type: 'admin',
        message: replyText,
      });

      if (selectedTicket.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedTicket.user_id,
          title: 'رد جديد على تذكرتك',
          message: `رد جديد على تذكرة ${selectedTicket.ticket_number}`,
          type: 'info',
        });
      }

      setReplyText('');
      openTicket(selectedTicket);
      toast({ title: 'تم إرسال الرد' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedTicket) return;
    await supabase.from('support_tickets')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedTicket.id);
    toast({ title: 'تم حفظ الملاحظات' });
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">غير مصرح بالوصول</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">تذاكر الدعم</h1>
        <p className="text-muted-foreground">إدارة طلبات الدعم والشكاوى</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث برقم التذكرة، البريد، الموضوع..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="open">مفتوح</SelectItem>
            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
            <SelectItem value="waiting_user">بانتظار المستخدم</SelectItem>
            <SelectItem value="resolved">تم الحل</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchTickets} variant="outline">تحديث</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={Inbox} title="لا توجد تذاكر" description="لم يتم استلام أي طلبات دعم بعد" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                    <TableCell className="font-medium max-w-48 truncate">{ticket.subject}</TableCell>
                    <TableCell className="text-sm">{TICKET_CATEGORY_LABELS[ticket.category]}</TableCell>
                    <TableCell className="text-sm">
                      <div>{ticket.name}</div>
                      <div className="text-xs text-muted-foreground">{ticket.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openTicket(ticket)}>عرض</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-sm">{selectedTicket.ticket_number}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${TICKET_STATUS_COLORS[selectedTicket.status]}`}>
                    {TICKET_STATUS_LABELS[selectedTicket.status]}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedTicket.subject}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-muted-foreground">الاسم:</span> {selectedTicket.name}</div>
                    <div><span className="text-muted-foreground">البريد:</span> {selectedTicket.email}</div>
                    <div><span className="text-muted-foreground">الهاتف:</span> {selectedTicket.phone ?? '—'}</div>
                    <div><span className="text-muted-foreground">الفئة:</span> {TICKET_CATEGORY_LABELS[selectedTicket.category]}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                  {attachments.filter(a => !a.reply_id).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.filter(a => !a.reply_id).map(a => (
                        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                          <FileText className="h-4 w-4" />
                          {a.file_name} ({(a.file_size / 1024).toFixed(0)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replies */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">المحادثة</h4>
                  {replies.map((reply) => (
                    <div key={reply.id} className={`rounded-lg p-3 ${reply.sender_type === 'admin' ? 'bg-primary/10 mr-8' : 'bg-muted ml-8'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">{reply.sender_type === 'admin' ? 'الإدارة' : 'المستخدم'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString('ar-EG')}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>

                {/* Admin Reply */}
                {selectedTicket.status !== 'closed' && (
                  <form onSubmit={submitReply} className="space-y-3 border-t pt-4">
                    <Label>رد الإدارة</Label>
                    <Textarea rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="اكتب الرد..." required />
                    <Button type="submit" disabled={actionLoading} size="sm">
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Reply className="h-4 w-4 ml-2" />إرسال الرد</>}
                    </Button>
                  </form>
                )}

                {/* Admin Notes */}
                <div className="border-t pt-4 space-y-2">
                  <Label>ملاحظات داخلية</Label>
                  <Textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="ملاحظات للموظفين..." />
                  <Button type="button" size="sm" variant="outline" onClick={saveNotes}>حفظ الملاحظات</Button>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 flex-wrap border-t pt-4">
                  <Button size="sm" variant="outline" onClick={() => updateStatus('in_progress')} disabled={actionLoading}>
                    <Clock className="h-4 w-4 ml-1" /> قيد المعالجة
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus('waiting_user')} disabled={actionLoading}>
                    بانتظار المستخدم
                  </Button>
                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatus('resolved')} disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 ml-1" /> تم الحل
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus('closed')} disabled={actionLoading}>
                    <XCircle className="h-4 w-4 ml-1" /> إغلاق
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
